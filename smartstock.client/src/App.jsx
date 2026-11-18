import Login from './pages/Login'
import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import MainLayout from './components/MainLayout'

function App() {
   const [token, setToken] = useState(null)

   const handleLogout = () => {
      setToken(null)
   }
   console.log('App has token:', Boolean(token))

   return (
      <Routes>
         
         <Route path="/" element={<Navigate to="/login" replace />} />


         //route to login page
         <Route
            path="/login"
            element={
               token
                  ? <Navigate to="/dashboard" replace />
                  : <Login onLogin={setToken} />
            }
         />

         //route to dashboard
         <Route
            element={
               token
                  ? <MainLayout onLogout={handleLogout} />
                  : <Navigate to="/login" replace />
            }
         >

            <Route path="/dashboard" element={<Dashboard />} />
            <Route
               path="/products"
               element={<Products token={token} />}
            />

         </Route>




      </Routes>
   )

}

export default App