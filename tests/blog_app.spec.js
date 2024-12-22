const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')
describe('Blog app', () => {
    beforeEach(async ({ page, request }) => {
        await request.post('http://localhost:3001/api/testing/reset')
        await request.post('http://localhost:3001/api/users', {
            data: {
                name: 'Matti Luukkainen',
                username: 'inkinvissible',
                password: 'ink232'
            }
        })
        await page.goto('http://localhost:5173')

    })

    test('Login form is shown', async ({ page }) => {
        const locator = await page.getByText('Log In to application')
        await expect(locator).toBeVisible()

        const elementFormUser = await page.getByTestId('usernameElement')
        const elementFormPass = await page.getByTestId('passwordElement')

        await expect(elementFormUser.getByRole('paragraph')).toContainText('Username')
        await expect(elementFormPass.getByRole('paragraph')).toContainText('Password')
        await expect(elementFormUser.getByRole('textbox')).toBeVisible()
        await expect(elementFormPass.getByRole('textbox')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
    })
    describe('Login', () => {
        test('succeeds with correct credentials', async ({ page }) => {
            await loginWith(page, 'inkinvissible', 'ink232')
            await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
        })

        test('fails with wrong credentials', async ({ page }) => {
            await loginWith(page, 'inkinvissible', 'inky232')
            await expect(page.getByText('Something happened. You could not log in. Wrong user or password')).toBeVisible()
        })
    })
    describe('When logged in', () => {
        beforeEach(async ({ page }) => {
            await loginWith(page, 'inkinvissible', 'ink232')
        })

        test('a new blog can be created', async ({ page }) => {
            await createBlog(page, 'Nueva nota', 'inkinvissible', 'google.com')
            const notification = page.getByTestId('notification')
            await expect(notification).toBeVisible()
            await expect(notification).toHaveText('New blog created successfully. Nueva nota by inkinvissible')
        })

        test('a like can be given', async ({ page }) => {
            await createBlog(page, 'Nueva nota', 'inkinvissible', 'google.com')

            await page.getByRole('button', { name: 'show' }).first().click()
            const locator = await page.getByText('Nueva Nota').locator('..')
            await locator.getByRole('button', { name: 'like' }).click()

            const notification = page.getByTestId('notification')
            await expect(notification).toBeVisible()
            await expect(notification).toHaveText('You liked : Nueva nota')
            await expect(locator.getByText('Likes: 1')).toBeVisible()

        })
        test('a blog can be deleted', async ({ page }) => {
            await createBlog(page, 'Nueva nota', 'inkinvissible', 'google.com')

            await page.getByRole('button', { name: 'show' }).first().click()
            const locator = await page.getByText('Nueva nota').locator('..')

            page.once('dialog', async (dialog) => {
                await dialog.accept()
            })

            await locator.getByRole('button', { name: 'remove' }).click()

            const notification = page.getByTestId('notification')
            await expect(notification).toBeVisible()
            await expect(notification).toHaveText('Blog successfully deleted', { timeout: 10000 })
        })
        test('the remove button can be only seen by the author', async ({ page }) => {

            await createBlog(page, 'Nota primera', 'user', 'google.com')
            await page.getByRole('button', { name: 'cancel' }).click()

            await page
                .locator('.blogTitleAuthor')
                .filter({ hasText: 'Nota primera' })
                .getByRole('button', { name: 'show' })
                .click()

            const locatorFirst = page.getByText('Nota primera').locator('..')


            await expect(locatorFirst.getByRole('button', { name: 'remove' })).not.toBeVisible()

        })
        test('the blogs are ordered depending on their likes descending', async ({ page }) => {
            
        })
    })
    test.afterEach(async ({ page }) => {
        // Limpiar el almacenamiento local
        await page.evaluate(() => window.localStorage.clear())
    })
})