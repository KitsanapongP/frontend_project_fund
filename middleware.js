import { NextResponse } from 'next/server'
// import Cookies from "js-cookie";
// This function can be marked `async` if using `await` inside
export async function middleware(request) {
//   return NextResponse.redirect(new URL('/home', request.url))
    try{
        const token = request.cookies.get('token')?.value
        if (!token) {
            return NextResponse.redirect(new URL('/', request.url))
          }
    }catch(err){
        return NextResponse.redirect(new URL('/',request.url))
    }
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: '/admin/:path*',
}