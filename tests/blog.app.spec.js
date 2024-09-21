const { test, expect, beforeEach, describe } = require('@playwright/test')



describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http:localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'prueba',
        username: 'Prueba',
        password: 'prueba'
      }
    })
    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    await page.goto('http://localhost:5173')

    const locator = await page.getByText('Blogs')
    await expect(locator).toBeVisible()
    await expect(page.getByText('Log in to application')).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {

      await page.getByRole('button', { name: 'login' }).click()
      await page.getByTestId('username').fill('Prueba')    
      await page.getByTestId('password').fill('prueba')  
      await page.getByRole('button', { name: 'login' }).click() 
  
      await expect(page.getByText('Prueba logged-in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {

      await page.getByRole('button', { name: 'login' }).click()
      await page.getByTestId('username').fill('Otro')    
      await page.getByTestId('password').fill('prueba')  
      await page.getByRole('button', { name: 'login' }).click() 

      await expect(page.getByText('Wrong Credentials')).toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await page.getByTestId('username').fill('Prueba')    
      await page.getByTestId('password').fill('prueba')  
      await page.getByRole('button', { name: 'login' }).click()
    })
  
    test('a new blog can be created', async ({ page }) => {
      await page.getByRole('button', { name: 'New Blog' }).click()
      await page.getByTestId('title').fill('A new title')
      await page.getByTestId('author').fill('A new author')
      await page.getByTestId('url').fill('A new url')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(page.getByText('A new blog was created!')).toBeVisible()
    })

    test('a new blog can be edited', async ({ page }) => {
      await page.getByRole('button', { name: 'New Blog' }).click()
      await page.getByTestId('title').fill('A new title')
      await page.getByTestId('author').fill('A new author')
      await page.getByTestId('url').fill('A new url')
      await page.getByRole('button', { name: 'Save' }).click()
      
      await page.getByRole('button', { name: 'View' }).click()
      await page.getByRole('button', { name: 'Like' }).click()
      await expect(page.getByText('Likes: 1')).toBeVisible()
    })

    test('a blog can be deleted by creator', async ({ page }) => {
      page.on('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'New Blog' }).click()
      await page.getByTestId('title').fill('A new title')
      await page.getByTestId('author').fill('A new author')
      await page.getByTestId('url').fill('A new url')
      await page.getByRole('button', { name: 'Save' }).click()
      
      await page.getByRole('button', { name: 'View' }).click()
      await page.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('A Blog was deleted successfully!')).toBeVisible()
    })

    test('a new blog can not be deleted by not creator', async ({ page, request }) => {
      await request.post('http://localhost:3003/api/users', {
        data: {
          name: 'facu',
          username: 'Facu',
          password: 'facu'
        }
      })

      await page.getByRole('button', { name: 'New Blog' }).click()
      await page.getByTestId('title').fill('A new title')
      await page.getByTestId('author').fill('A new author')
      await page.getByTestId('url').fill('A new url')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(page.getByText('A new blog was created!')).toBeVisible()

      await page.getByRole('button', { name: 'Log Out' }).click()

      await page.getByTestId('username').fill('Facu')    
      await page.getByTestId('password').fill('facu')  
      await page.getByRole('button', { name: 'login' }).click()
      await page.getByRole('button', { name: 'View' }).click()

      await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible()
    })

    test('blogs are ordered by likes', async ({ page }) => {

      await page.getByRole('button', { name: 'New Blog' }).click()
      await page.getByTestId('title').fill('A new title')
      await page.getByTestId('author').fill('A new author')
      await page.getByTestId('url').fill('A new url')
      await page.getByRole('button', { name: 'Save' }).click()

      await expect(page.getByText('A new blog was created!')).toBeVisible()
      await expect(page.getByText('A new blog was created!')).not.toBeVisible()

      await page.getByRole('button', { name: 'New Blog' }).click()
      await page.getByTestId('title').fill('A second title')
      await page.getByTestId('author').fill('A second author')
      await page.getByTestId('url').fill('A second url')
      await page.getByRole('button', { name: 'Save' }).click()

      await expect(page.getByText('A new blog was created!')).toBeVisible()
      await expect(page.getByText('A second title')).toBeVisible()

      await page.getByRole('button', { name: 'View' }).first().click()
      await page.getByRole('button', { name: 'Like' }).click()
      await expect(page.getByText('Likes: 1')).toBeVisible()
      await page.getByRole('button', { name: 'Hide' }).click()

      await page.getByRole('button', { name: 'View' }).nth(1).click()
      await page.getByRole('button', { name: 'Like' }).click()
      await expect(page.getByText('Likes: 1')).toBeVisible()
      await page.getByRole('button', { name: 'Like' }).click()
      await expect(page.getByText('Likes: 2')).toBeVisible()
      await page.getByRole('button', { name: 'Hide' }).click()

      expect(page.locator('.blog').first()).toContainText('A second title')
      expect(page.locator('.blog').nth(1)).toContainText('A new title')

    })
  })

})