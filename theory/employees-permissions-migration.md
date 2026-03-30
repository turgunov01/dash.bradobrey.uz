# Employees + User-Permission Migration

## Human View

### Что вы хотите получить

1. Переименовать сущность `barber` в `employee` на уровне UI и бизнес-терминов.
2. Перейти от одной роли к нормальной permission-модели.
3. Ввести роли:
   - `admin`
   - `manager`
   - `barber`
   - `super-barber`
   - `super-manager`
4. Подготовить проект к дальнейшему росту без хаотичных `if role === ...` по всему фронту.

### Текущее состояние проекта

Сейчас проект концептуально завязан на `barber`:

- маршруты и страницы: `app/pages/barbers/*`
- клиентский API: `app/composables/useBarbersApi.ts`
- схема данных: `shared/schemas/index.ts`
- доступ в панель: `server/utils/dashboard-access.ts`
- проверка ролей: `server/utils/admin-access.ts`
- навигация и labels: `app/composables/useDashboardNavigation.ts`, `app/utils/display.ts`
- store сессии: `app/stores/session.ts`

При этом права пока почти не моделируются как права. По факту есть жёсткая проверка `admin_network` и дальше UI в основном живёт в допущении "пользователь либо барбер, либо админ".

### Почему просто "добавить роли" недостаточно

Если просто записать в БД пять ролей, но оставить проект в текущем виде, произойдёт следующее:

- маршруты останутся завязаны на старую терминологию `barbers`
- доступ будет по-прежнему контролироваться точечно и неравномерно
- разные экраны начнут по-разному трактовать одинаковые роли
- придётся плодить условные блоки вида `if role === 'manager' || role === 'super-manager'`
- через 2-3 итерации проект станет трудно расширять

Нужен не набор ролей сам по себе, а слой `permissions`.

### Рекомендуемый подход

Правильная схема:

1. Роль хранится в пользователе.
2. На фронте и сервере существует единый каталог permissions.
3. UI, роуты и серверные handlers спрашивают не "кто ты?", а "что тебе можно?".
4. Роль становится только способом выдачи набора permissions.

Пример:

- `admin`
  - полный доступ ко всем разделам
- `manager`
  - доступ к филиалу, сотрудникам, услугам, истории, статистике
  - без системных настроек и без глобального управления всеми филиалами
- `barber`
  - только своё рабочее место, очередь, свой профиль, свою историю
- `super-barber`
  - всё, что у `barber`
  - плюс дополнительные расширенные действия по очереди и истории
- `super-manager`
  - всё, что у `manager`
  - плюс межфилиальный контроль, расширенная аналитика и управление персоналом

### Что такое permission-модель в этом проекте

Вместо проверки ролей напрямую вводится матрица прав. Например:

- `employees.read`
- `employees.create`
- `employees.update`
- `employees.delete`
- `schedule.manage`
- `queue.read`
- `queue.manage.self`
- `queue.manage.branch`
- `history.read.self`
- `history.read.branch`
- `statistics.read.self`
- `statistics.read.branch`
- `statistics.read.global`
- `services.read`
- `services.manage`
- `promo.manage`
- `marketplace.manage`
- `branches.manage`
- `settings.manage`

После этого роли становятся просто mapping:

- `admin` -> все permissions
- `super-manager` -> почти все операционные permissions без системных
- `manager` -> branch-level permissions
- `super-barber` -> расширенный self/branch operational набор
- `barber` -> минимальный self-service набор

### Как переименовывать `barbers` в `employees`

Нужно разделить на два уровня:

1. Business naming:
   - в UI, меню, заголовках, таблицах, модалках, docs, labels
   - пользователь видит "Сотрудники"

2. Technical compatibility:
   - внутренние API и таблицы можно не ломать за один проход
   - сначала внедряется alias/adapter
   - потом, если нужно, делается глубокий rename

Практичный вариант:

- сначала UI-labels и навигацию переименовать в `employees`
- маршрут `/barbers` перевести на `/employees` через redirect/alias
- внутренние server routes `/api/barbers/*` временно оставить
- затем уже проводить технический rename, если он действительно нужен

Это снизит риск массовых регрессий.

### Какие изменения будут

#### 1. Терминология

- `barber` -> `employee` в UI
- список барберов -> список сотрудников
- история барберов -> история сотрудников
- workspace барбера -> рабочее место сотрудника или рабочее место мастера

#### 2. Навигация

- пункты меню должны зависеть от permissions
- часть пунктов будет видна только `manager/admin`
- часть только `barber/super-barber`

#### 3. Сессия

Сессия должна содержать:

- `user.id`
- `user.role`
- `user.permissions[]`
- `user.branchScope`
- `user.employeeProfile` или `employee`

#### 4. Server guards

Нужны guards уровня:

- `requirePermission('employees.read')`
- `requireAnyPermission([...])`
- `requireBranchScopeAccess()`
- `requireSelfOrPermission(...)`

#### 5. UI guards

Нужны composables уровня:

- `usePermissions()`
- `can('employees.update')`
- `canAny([...])`
- `canManageBranch(branchId)`

#### 6. API surface

Понадобится нормализовать доступ:

- список сотрудников
- создание/редактирование/удаление сотрудника
- доступ к очереди
- доступ к статистике
- доступ к истории
- branch-scoped и self-scoped выборки

#### 7. Data model

Минимально потребуется:

- поле `role`
- вычисляемый или сохранённый набор permissions
- привязка к филиалу
- тип сотрудника / operational scope

### Риски внедрения

#### Высокие риски

1. Сломать доступ в панель.
   Сейчас доступ завязан на `admin_network` и барбер-сессию. Если резко переключить логику, можно закрыть вход и админу, и мастеру.

2. Сломать навигацию и условный рендеринг.
   Меню и страницы сейчас предполагают старую структуру ролей.

3. Смешать branch-level и self-level права.
   Например, `manager` должен видеть сотрудников филиала, а `barber` только себя.

4. Поймать несогласованность между frontend и backend.
   UI может считать, что экран доступен, а backend будет резать запросы.

5. Неполный rename.
   Пользователь увидит одновременно "Барберы", "Сотрудники", `/barbers`, `/employees`.

#### Средние риски

1. Разрастание permission-матрицы без системы именования.
2. Дублирование логики guard-ов на клиенте и сервере.
3. Скрытые зависимости в статистике, истории и киоске.
4. Частичное переименование только UI без обновления docs и тестовых сценариев.

#### Низкие, но неприятные риски

1. Поломка breadcrumbs, ссылок и редиректов.
2. Старые deep-links на `/barbers/*`.
3. Непонятные пользователю статусы доступа "403" без внятного сообщения.

### Как эти риски уменьшать

1. Делать migration по этапам, а не одной большой заменой.
2. Сначала ввести permission-layer, потом менять UI.
3. Временно сохранить backward compatibility для `/barbers/*`.
4. Все server handlers перевести на единые guard-функции.
5. Вести одну role-permission matrix в одном месте.
6. На время перехода логировать denied-сценарии.

### Плюсы микрофронтенда

Если смотреть именно с точки зрения роста проекта, плюсы есть:

1. Можно разделить большие домены:
   - employees
   - queue/workspace
   - analytics
   - marketplace
   - kiosk

2. Отдельные команды могут независимо выпускать части панели.

3. Проще изолировать разные контуры доступа и UI-композиции.

4. Удобнее масштабировать очень разные по природе части продукта:
   kiosk и admin-dashboard реально живут в разных контекстах.

5. Можно независимее модернизировать старые и новые модули.

### Но для этого проекта есть важная оговорка

Микрофронтенд не является первым шагом для вашей задачи.

Сейчас главная проблема не в способе сборки фронта, а в:

- терминологии
- access control
- role/permission модели
- разбросанной бизнес-логике

Если сейчас сначала пойти в микрофронтенд, вы получите:

- больше инфраструктуры
- больше сложностей с auth/session
- дублирование permission-логики между приложениями
- более дорогую отладку

Для этого проекта микрофронтенд имеет смысл только после стабилизации:

1. общей сессии
2. единой permission-модели
3. нормализованных API-контрактов
4. согласованной терминологии `employee`

Вывод:

- плюсы у микрофронтенда есть
- но на этой стадии проекта я бы рекомендовал сначала сделать modular monolith frontend с чёткими доменными модулями, а не полноценный microfrontend split

## Code View

### Что конкретно придётся менять в этом репозитории

#### 1. Domain naming

Файлы и зоны, где сидит старый домен `barber`:

- `app/pages/barbers/*`
- `app/composables/useBarbersApi.ts`
- `server/api/barbers/*`
- `shared/schemas/index.ts`
- `app/stores/session.ts`
- `app/composables/useDashboardNavigation.ts`
- `app/utils/display.ts`
- `server/utils/dashboard-access.ts`
- `server/utils/admin-access.ts`

На первом этапе я бы не делал тотальный rename путей в один проход.

Рекомендуемый порядок:

1. labels/UI -> `employees`
2. добавить alias routes `/employees/*`
3. адаптировать composables и guards
4. только потом решать, нужен ли глубокий rename server/api path names

#### 2. Role source of truth

Сейчас роль фактически читается из Supabase `users.role` и частично прокидывается через login/me handlers.

Нужно ввести:

- единый enum ролей
- mapping role -> permissions
- нормализацию session payload

Пример целевых типов:

```ts
type UserRole =
  | 'admin'
  | 'manager'
  | 'barber'
  | 'super-barber'
  | 'super-manager'

type Permission =
  | 'employees.read'
  | 'employees.create'
  | 'employees.update'
  | 'employees.delete'
  | 'queue.read'
  | 'queue.manage.self'
  | 'queue.manage.branch'
  | 'statistics.read.self'
  | 'statistics.read.branch'
  | 'statistics.read.global'
  | 'services.manage'
  | 'promo.manage'
  | 'marketplace.manage'
```

#### 3. Central permission registry

Нужен единый модуль, например:

- `shared/auth/roles.ts`
- `shared/auth/permissions.ts`
- `server/utils/permissions.ts`
- `app/composables/usePermissions.ts`

В нём:

- список ролей
- список permissions
- mapping ролей в permissions
- функции `hasPermission`, `hasAnyPermission`, `hasAllPermissions`

#### 4. Session reshaping

Сейчас `app/stores/session.ts` и server auth handlers ориентированы на `barber/user`.

Нужно перейти к более общей структуре:

```ts
type SessionUser = {
  id: string
  login: string | null
  role: UserRole
  permissions: Permission[]
  branch_id: string | null
}

type EmployeeProfile = {
  id: string
  name: string | null
  phone: string | null
  specialization: string | null
}
```

#### 5. Route guards

Сейчас доступ в панель проверяется очень грубо.

Нужно переделать:

- `server/utils/dashboard-access.ts`
- `server/utils/admin-access.ts`

Вместо проверки одного `admin_network`:

- нормализовать role
- вычислять permissions
- проверять permissions на server-side для каждого handler-а

#### 6. Client-side conditional rendering

Нужно пройтись по:

- dashboard navigation
- index/dashboard widgets
- pages history/statistics
- employees/workspace pages
- marketplace/services/promo pages

И заменить role-specific условия на permission-specific.

Пример:

```ts
if (can('employees.read')) { ... }
if (can('statistics.read.branch')) { ... }
if (can('queue.manage.self')) { ... }
```

#### 7. API contracts

Сейчас endpoint naming и payload naming местами завязаны на `barber`.

Что нужно сделать:

- сохранить compatibility слой для старых `/api/barbers/*`
- постепенно ввести `/api/employees/*`
- внутри server layer выровнять DTO на более общие `employee`-названия там, где это не ломает backend

#### 8. Branch scoping

Для `manager` и `super-manager` нужен явный branch-scope.

В коде это затронет:

- query filters
- statistics
- history
- employees list
- queue access

Нужно отдельно различать:

- self scope
- branch scope
- global scope

#### 9. UI rename map

Что надо переименовать визуально:

- `Барберы` -> `Сотрудники`
- `Рабочее место барбера` -> `Рабочее место сотрудника` или `Рабочее место мастера`
- `История барберов` -> `История сотрудников`
- `Барбер` в фильтрах -> `Сотрудник` там, где это бизнесово корректно

Важно:

- если экран реально только для мастеров очереди, слово `barber` иногда лучше оставить как подтип сотрудника
- то есть rename должен быть не слепым, а семантическим

## Recommended rollout

### Этап 1. Theory + matrix

- утвердить role-permission matrix
- утвердить naming policy: где `employee`, где `barber`

### Этап 2. Technical foundation

- ввести shared role/permission registry
- обновить session payload
- обновить server guards

### Этап 3. UI adaptation

- permission-aware navigation
- permission-aware route rendering
- rename UI labels to `employees`

### Этап 4. API adaptation

- employee aliases
- branch/self/global scopes
- backward compatibility для старых paths

### Этап 5. Hard cleanup

- убрать legacy role checks
- убрать лишние `barber`-названия там, где они больше не нужны
- закрыть migration через smoke-tests по ролям

## Bottom Line

### Что я рекомендую

1. Не начинать с микрофронтенда.
2. Сначала ввести permission-core.
3. Потом переименовать `barbers` в `employees` на уровне UI и навигации.
4. Затем перевести server guards и API на role + permission.
5. И только после стабилизации рассматривать более крупную модульную декомпозицию.

### Главная мысль

Ваш следующий реальный шаг не "ещё одна роль", а:

`role -> permissions -> scopes -> UI/API guards`

И только поверх этого уже делать rename домена и дальнейшее масштабирование.
