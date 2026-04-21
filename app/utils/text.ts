const CP1251_SPECIAL_CODE_POINTS = [
  0x0402, 0x0403, 0x201A, 0x0453, 0x201E, 0x2026, 0x2020, 0x2021,
  0x20AC, 0x2030, 0x0409, 0x2039, 0x040A, 0x040C, 0x040B, 0x040F,
  0x0452, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014,
  0x0098, 0x2122, 0x0459, 0x203A, 0x045A, 0x045C, 0x045B, 0x045F,
  0x00A0, 0x040E, 0x045E, 0x0408, 0x00A4, 0x0490, 0x00A6, 0x00A7,
  0x0401, 0x00A9, 0x0404, 0x00AB, 0x00AC, 0x00AD, 0x00AE, 0x0407,
  0x00B0, 0x00B1, 0x0406, 0x0456, 0x0491, 0x00B5, 0x00B6, 0x00B7,
  0x0451, 0x2116, 0x0454, 0x00BB, 0x0458, 0x0405, 0x0455, 0x0457
] as const

const cp1251EncodeMap = new Map<number, number>(
  CP1251_SPECIAL_CODE_POINTS.map((codePoint, index) => [codePoint, 0x80 + index])
)

function countMojibakeMarkers(value: string) {
  let count = 0

  for (const letter of value) {
    if (letter === 'Р' || letter === 'С') {
      count += 1
    }
  }

  return count
}

function looksLikeCp1251Mojibake(value: string) {
  const text = value.trim()

  if (text.length < 6) {
    return false
  }

  const markerCount = countMojibakeMarkers(text)

  return markerCount / text.length >= 0.3
}

function encodeCp1251(value: string): Uint8Array | null {
  const bytes = new Uint8Array(value.length)

  for (let index = 0; index < value.length; index++) {
    const codePoint = value.charCodeAt(index)

    if (codePoint < 0x80) {
      bytes[index] = codePoint
      continue
    }

    if (codePoint >= 0x0410 && codePoint <= 0x042F) {
      bytes[index] = 0xC0 + (codePoint - 0x0410)
      continue
    }

    if (codePoint >= 0x0430 && codePoint <= 0x044F) {
      bytes[index] = 0xE0 + (codePoint - 0x0430)
      continue
    }

    const mapped = cp1251EncodeMap.get(codePoint)

    if (mapped === undefined) {
      return null
    }

    bytes[index] = mapped
  }

  return bytes
}

function decodeUtf8(bytes: Uint8Array) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  }
  catch {
    return null
  }
}

export function fixMojibakeCp1251(value: string) {
  if (!looksLikeCp1251Mojibake(value)) {
    return value
  }

  const bytes = encodeCp1251(value)

  if (!bytes) {
    return value
  }

  const decoded = decodeUtf8(bytes)

  if (!decoded) {
    return value
  }

  const trimmed = decoded.trim()

  if (!trimmed) {
    return value
  }

  const originalMarkers = countMojibakeMarkers(value)
  const decodedMarkers = countMojibakeMarkers(decoded)
  const isShorter = decoded.length <= value.length * 0.85

  return decodedMarkers < originalMarkers && isShorter ? decoded : value
}

