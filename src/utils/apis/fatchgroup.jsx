import DjangoConfig from "@/config/config";



export const fetchGroups = async () => {
    try {
      const response = await fetch(`${DjangoConfig.apiUrl}get_user_groups`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };