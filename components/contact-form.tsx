"use client";

import { useState } from "react";
import { Button } from "./ui/button";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type FormStatus = "idle" | "pending" | "success" | "error";

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      setFormStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form
        name="contact"
        method="POST"
        data-netlify="true"
        netlify-honeypot="bot-field"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input type="hidden" name="form-name" value="contact" />
        <p className="hidden" style={{ display: "none" }}>
          <label>
            Don't fill this out:{" "}
            <input name="bot-field" onChange={handleInputChange} />
          </label>
        </p>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            required
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Button
          type="submit"
          disabled={formStatus === "pending"}
          className="w-full"
        >
          {formStatus === "pending" ? "Sending..." : "Send Message"}
        </Button>
      </form>

      {formStatus === "success" && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Thank you for your message! I'll get back to you soon.
        </div>
      )}

      {formStatus === "error" && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage || "Something went wrong. Please try again."}
        </div>
      )}
    </div>
  );
}