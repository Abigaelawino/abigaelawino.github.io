"use client";

import { useState } from "react";
import { Button } from "./ui/button";

interface NewsletterFormData {
  email: string;
}

type FormStatus = "idle" | "pending" | "success" | "error";

export function NewsletterForm() {
  const [formData, setFormData] = useState<NewsletterFormData>({
    email: "",
  });
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({ email: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("pending");
    setErrorMessage("");

    try {
      const formElement = e.target as HTMLFormElement;
      const formDataToSend = new FormData(formElement);
      
      const response = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formDataToSend as any).toString(),
      });

      if (response.ok) {
        setFormStatus("success");
        setFormData({ email: "" });
      } else {
        throw new Error("Newsletter subscription failed");
      }
    } catch (error) {
      setFormStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <form
        name="newsletter"
        method="POST"
        data-netlify="true"
        netlify-honeypot="bot-field"
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        <input type="hidden" name="form-name" value="newsletter" />
        <p className="hidden" style={{ display: "none" }}>
          <label>
            Don't fill this out:{" "}
            <input name="bot-field" onChange={handleInputChange} />
          </label>
        </p>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="your@email.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button
          type="submit"
          disabled={formStatus === "pending"}
          className="w-full"
          variant="outline"
        >
          {formStatus === "pending" ? "Subscribing..." : "Subscribe"}
        </Button>
      </form>

      {formStatus === "success" && (
        <div className="mt-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          Thanks for subscribing! You'll receive updates at {formData.email || "your email address"}.
        </div>
      )}

      {formStatus === "error" && (
        <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {errorMessage || "Something went wrong. Please try again."}
        </div>
      )}
    </div>
  );
}