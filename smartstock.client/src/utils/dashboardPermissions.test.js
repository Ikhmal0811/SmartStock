import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { test } from 'node:test'
import { canCreateSale } from './dashboardPermissions.js'

const makeToken = (payload) => {
    const encode = (value) =>
        Buffer.from(JSON.stringify(value)).toString('base64url')

    return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.signature`
}

test('canCreateSale accepts Admin and Staff role claims', () => {
    assert.equal(canCreateSale(makeToken({ role: 'Admin' })), true)
    assert.equal(canCreateSale(makeToken({ role: 'Staff' })), true)
    assert.equal(
        canCreateSale(
            makeToken({
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role':
                    'Admin',
            })
        ),
        true
    )
})

test('New Sale permission denies Viewer, unknown, missing, and malformed roles', () => {
    assert.equal(canCreateSale(makeToken({ role: 'Viewer' })), false)
    assert.equal(canCreateSale(makeToken({ role: 'Manager' })), false)
    assert.equal(
        canCreateSale(
            makeToken({
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role':
                    'Viewer',
            })
        ),
        false
    )
    assert.equal(canCreateSale(makeToken({})), false)
    assert.equal(canCreateSale(null), false)
    assert.equal(canCreateSale(''), false)
    assert.equal(canCreateSale('malformed'), false)
})
