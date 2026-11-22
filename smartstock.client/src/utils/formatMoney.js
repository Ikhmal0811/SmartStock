export const formatMoney = (value) =>
    Number(value || 0).toLocaleString('en-MY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
