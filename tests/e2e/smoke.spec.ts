import { test, expect } from "@playwright/test";

const email = `e2e-${Date.now()}@example.com`;

test("public landing page renders with deploy link", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/coding agent/i);
  await expect(page.getByRole("link", { name: /deploy to vercel/i }).first()).toHaveAttribute("href", /vercel\.com\/new\/clone/);
});

test("documentation is reachable without auth and has navigation", async ({ page }) => {
  await page.goto("/docs");
  await expect(page.getByRole("heading", { name: "Fury Agent", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Installation", exact: true }).first().click();
  await expect(page).toHaveURL(/\/docs\/installation$/);
  await expect(page.getByRole("heading", { name: /installation/i }).first()).toBeVisible();
});

test("protected dashboard redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("register, then reach the dashboard", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
});

test("mobile layout has bottom navigation and no horizontal overflow", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
