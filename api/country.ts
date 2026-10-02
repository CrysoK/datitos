export const config = {
  runtime: 'edge',
}

export default function handler(request: Request) {
  const geoCountry = request.headers.get('x-vercel-ip-country')
  const country = (geoCountry || 'AR').toUpperCase()
  return new Response(JSON.stringify({
    country,
    source: geoCountry ? 'vercel-ip' : 'default',
  }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
