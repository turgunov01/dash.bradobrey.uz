import { ensureMerchantAccess } from '~~/server/utils/merchant-access'

export default defineEventHandler(async (event) => {
  const access = await ensureMerchantAccess(event)

  return {
    barbershop_id: access.barbershopId,
    user: access.user
  }
})

