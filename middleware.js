import { NextResponse } from 'next/server'
// import Cookies from "js-cookie";
// This function can be marked `async` if using `await` inside
export async function middleware(request) {
//   return NextResponse.redirect(new URL('/home', request.url))
    try{
        const token = request.cookies.get('token')?.value
        const role = request.cookies.get('role')?.value
        if (!token) {
            return NextResponse.redirect(new URL('/', request.url))
        }
        // if(role != "admin"){
        //     return NextResponse.redirect(new URL('/user', request.url))
        // }
    }catch(err){
        return NextResponse.redirect(new URL('/',request.url))
    }
}
 
// See "Matching Paths" below to learn more
export const config = {
    matcher: ["/user/:path*", "/admin/:path*"],
}