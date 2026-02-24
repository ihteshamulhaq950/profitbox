import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-900">
                Authentication Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {params?.error ? (
                <div className="bg-white rounded p-3 border border-red-200">
                  <p className="text-sm text-red-800 font-mono">
                    {params.error}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-red-800">
                  An unspecified error occurred during authentication.
                </p>
              )}
              <p className="text-xs text-red-700">
                This might be due to an expired link or network issue. Please
                try signing up again.
              </p>
              <Link href="/auth/sign-up" className="block">
                <Button className="w-full" variant="default">
                  Try Again
                </Button>
              </Link>
              <Link href="/auth/login" className="block">
                <Button className="w-full" variant="outline">
                  Back to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
