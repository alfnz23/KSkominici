export const dynamic = 'force-dynamic'
export const revalidate = 0

import dynamicImport from 'next/dynamic'

const LoginClient = dynamicImport(() => import('./LoginClient'), { ssr: false })

export default function LoginPage() {
  return <LoginClient />
}
