const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

// helper to parse error body
async function parseError(res) {
	// try json then text
	try {
		const json = await res.json();
		if (json?.detail) return json.detail;
		if (json?.message) return json.message;
		return JSON.stringify(json);
	} catch {
		try {
			return await res.text();
		} catch {
			return `HTTP ${res.status}`;
		}
	}
}

//signup
export async function signup(name, email, password) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("email", email);
  formData.append("password", password);

  const res = await fetch(`${API_URL}/signup`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await parseError(res);
    throw new Error(err || "Signup failed");
  }
  return await res.json();
}

// Login
export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (!res.ok) {
    const err = await parseError(res);
    throw new Error(err || "Invalid credentials");
  }
  return await res.json();
}

// Upload
export async function uploadDocument(token, file) {
  const formData = new FormData();
  // backend expects field name 'file'
  formData.append("file", file);

  const res = await fetch(`${API_URL}/upload/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await parseError(res);
    throw new Error(err || "Upload failed");
  }
  return await res.json();
}

// Fetch user documents
export async function getUserDocs(token) {
  const res = await fetch(`${API_URL}/api/get-user-docs`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await parseError(res);
    throw new Error(err || "Fetch failed");
  }
  return await res.json();
}
