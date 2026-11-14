// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardContent } from "@/components/ui/card";

describe("UI primitives", () => {
  it("renders a task status badge with a human label", () => {
    render(<Badge status="waiting_approval" />);
    expect(screen.getByText("waiting approval")).toBeInTheDocument();
  });

  it("falls back to a neutral style for unknown statuses", () => {
    render(<Badge status="something_new" />);
    expect(screen.getByText("something new")).toBeInTheDocument();
  });

  it("renders a button with its accessible name and variant classes", () => {
    render(<Button variant="destructive">Delete my account</Button>);
    const btn = screen.getByRole("button", { name: "Delete my account" });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("bg-red-600");
  });

  it("composes card content", () => {
    render(
      <Card>
        <CardTitle>Provider status</CardTitle>
        <CardContent>Groq · llama-3.3-70b</CardContent>
      </Card>
    );
    expect(screen.getByRole("heading", { name: "Provider status" })).toBeInTheDocument();
    expect(screen.getByText(/llama-3.3-70b/)).toBeInTheDocument();
  });
});
