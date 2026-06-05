export async function checkCode(code) {
    if (!code) throw new Error('Code is required')
    let customerconnected = false
    try
    {
        if( code === 'nam')
        {
            customerconnected = true
        }
    }
    catch (error) {
        throw error instanceof Error ? error : new Error(String(error))
    }
    return customerconnected
}