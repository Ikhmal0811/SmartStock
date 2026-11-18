import { useState } from 'react'
import { useNavigate } from 'react-router'



function Login({ onLogin }) {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [isError, setIsError] = useState(false)
    const navigate = useNavigate()


    //function to handle submit of email and password
    const handleSubmit = async (e) => {
        //prevent browser from refreshing
        e.preventDefault()

        try {
            //send email and password to api
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })

            if (!response.ok) {
                setIsError(true)
                setMessage('Invalid email or password.')
                return
            }

            const data = await response.json()

            if (!data.token) {
                setIsError(true)
                setMessage('Login response did not contain a token.')
                return
            }


            //get token jwt if login successfull
            onLogin(data.token)




            setIsError(false)
            setMessage('Login successful!')
            navigate('/dashboard', { replace: true })


        } catch (error) {
            console.error('Unable to connect to the API.')
            setIsError(true)
            setMessage('Unable to connect to the server.')
        }


    }

    return (
        <div
            className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
                <h1 className="text-3xl font-bold text-blue-600">
                    SmartStock
                </h1>

                <p className="mt-2 text-slate-500">
                    Sign in to manage your inventory
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
                        Sign In
                    </button>

                    {message && (
                        <p role="status" className={`mt-4 text-center text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>
                            {message}
                        </p>
                    )}

                </form>
            </div>
        </div>
    )
}

export default Login