import DjangoConfig from "@/config/config";
import axios from "axios";
import Cookies from "js-cookie";


const API_URL = DjangoConfig.apiUrl;

// ✅ Always send credentials (cookies)
axios.defaults.withCredentials = true;

// Fetch CSRF token and store it
export const getCSRFToken = async () => {
    const response = await axios.get(`${API_URL}csrf/`, { withCredentials: true });
    axios.defaults.headers.common["X-CSRFToken"] = getCookie("csrftoken");
};

// Function to read CSRF token from cookies
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
};
//login
export const login = async (username, password) => {
    try {
        const response = await axios.post(`${API_URL}login/`,
            { username, password },
            { withCredentials: true }
        );

        localStorage.setItem("username", response.data.username);
        return response.data;
    } catch (error) {
        console.error("Login failed", error);
        throw error;
    }
};

// Logout function
export const handleLogout = async () => {
    try {
        await fetch(`${API_URL}logout/`, {
            method: "GET",
            credentials: "include",
        });

        localStorage.removeItem("username");
        Cookies.remove("sessionid");
        Cookies.remove("csrftoken");
        console.log("Logout successful");
    } catch (err) {
        console.error("Logout failed:", err);
    }



};


// ✅ Get logged-in user details
export const getUser = async () => {
    const response = await axios.get(`${API_URL}user/`, { withCredentials: true });
    return response.data;
};

export const isAuthenticated = async () => {
    try {
        const response = await axios.get(`${API_URL}check_authentication/`, { withCredentials: true });
        return response.data.is_authenticated; // ✅ Properly return the value
    } catch (error) {
        console.error("Error checking authentication:", error);
        return false; // ✅ Return false on error
    }
};


