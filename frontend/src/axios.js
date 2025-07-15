// src/axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8000/api", // ✅ your backend base path
  withCredentials: true, // optional, if using cookies
});

export default instance;
