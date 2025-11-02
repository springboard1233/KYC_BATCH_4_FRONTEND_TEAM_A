import React, { useState } from "react";
import { login } from "./api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(circle at 10% 20%, rgba(3,105,161,0.06), transparent 12%), " +
          "radial-gradient(circle at 90% 80%, rgba(8,145,178,0.05), transparent 12%), " +
          "linear-gradient(135deg, #e9f8ff 0%, #f7fbfb 65%)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border rounded-lg shadow-md p-8"
      >
        {/* subtle brand accent */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M12 2C8 2 4 6 4 10c0 7 8 12 8 12s8-5 8-12c0-4-4-8-8-8z"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Sign in
        </h2>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 p-2 rounded">
            {error}
          </div>
        )}

        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input
          className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="block text-sm text-gray-600 mb-1">Password</label>
        <input
          className="w-full mb-6 px-3 py-2 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white ${
            loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
