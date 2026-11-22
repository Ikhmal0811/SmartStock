import Login from './pages/Login'
import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import MainLayout from './components/MainLayout'
import StockManagement from './pages/StockManagement'
import Sales from './pages/Sales'

function App() {
   const [token, setToken] = useState(null)

   const handleLogout = () => {
      setToken(null)
   }

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

            <Route
               path="/dashboard"
               element={<Dashboard token={token} />}
            />
            <Route
               path="/products"
               element={<Products token={token} />}
            />

            <Route
               path="/stock"
               element={<StockManagement token={token} />}
            />

            <Route
               path="/sales"
               element={<Sales token={token} />}
            />

         </Route>






      </Routes>
   )

}

export default App