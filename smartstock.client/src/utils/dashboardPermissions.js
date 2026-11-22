import { jwtDecode } from 'jwt-decode'

const ROLE_CLAIM =
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

export function getDashboardRole(token) {
    if (!token) return ''

    try {
        const decoded = jwtDecode(token)

        return decoded?.role || decoded?.[ROLE_CLAIM] || ''
    } catch {
        return ''
    }
}

export function canCreateSale(token) {
    return ['Admin', 'Staff'].includes(getDashboardRole(token))
}
