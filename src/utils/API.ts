
const BASE_URL = `http://localhost:8000`;

// Helper to get auth header
function getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Auth API
export const authAPI = {
    async signup(email: string, password: string, name: string, role: 'admin' | 'operator', operatorName: string) {
        const response = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name, role, operatorName })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Signup failed');
        }

        return response.json();
    },

    async signin(email: string, password: string) {
        const response = await fetch(`${BASE_URL}/api/v1/auth/signin`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Signin failed");
        }

        if (data.access_token) {
            localStorage.setItem("authToken", data.access_token);
            console.log("token saved", data.access_token);
        }

        return data;
    },

    signout() {
        localStorage.removeItem("authToken");
    },

    getSession() {
        return localStorage.getItem("authToken");
    },

    // async getUser() {
    //     // const { data: { user }, error } = await supabase.auth.getUser();
    //     const user = 'alex';
    //     // if (error) throw error;
    //     return user;
    // }

};

// Reports API
export const reportsAPI = {
    async submitReport(operatorId: number, uploadedBy: number, file: File) {

        // 1. Create a FormData object to handle the multipart request
        const formData = new FormData();
        // Append non-file parameters as strings
        formData.append('operator_id', operatorId.toString());
        formData.append('uploaded_by', uploadedBy.toString());
        // Append the file, using 'file' as the key to match the backend endpoint
        formData.append('file', file);

        const response = await fetch(`${BASE_URL}/api/v1/reports/submit`, {
            method: 'POST',
            headers: {
                ...getAuthHeader()
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Report submission failed:', error);
            throw new Error(error.error || 'Report submission failed');
        }

        return response.json();
    },

    async getMyReports(operatorId: number | null) {
        if (operatorId === null) {
            throw new Error("operatorId is required");
        }

        const response = await fetch(
            `${BASE_URL}/api/v1/metrics/operator/${operatorId}`,
            {
                method: 'GET',
                headers: getAuthHeader()
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch reports');
        }

        return response.json();
    },

    async getPendingReports() {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/reports/?status=unapproved`, {
            method: 'GET',
            headers: authHeader
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Fetching pending reports failed:', error);
            throw new Error(error.error || 'Failed to fetch pending reports');
        }

        return response.json();
    },

    async getApprovedReports() {
        const response = await fetch(`${BASE_URL}/api/v1/reports/?status=approved`, {
            method: 'GET',
            headers: getAuthHeader()
        });

        if (!response.ok) throw new Error("Failed to fetch approved reports");
        return response.json();
    },

    async reviewReport(reportId: string, action: 'approved' | 'rejected') {
        if (action === 'approved') {
            const response = await fetch(`${BASE_URL}/api/v1/reports/approve/${reportId}`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader()
                }
            });

            if (!response.ok) throw new Error("Failed to review report");
            return response.json();
        } else if (action === 'rejected') {
            const response = await fetch(`${BASE_URL}/api/v1/reports/reject/${reportId}`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader()
                }
            });

            if (!response.ok) throw new Error("Failed to review report");
            return response.json();
        }
    },

    async compareWithEMS(reportId: string, emsData: any) {
        const response = await fetch(`${BASE_URL}/reports/compare-ems`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            },
            body: JSON.stringify({ reportId, emsData })
        });

        if (!response.ok) throw new Error("Failed to compare EMS");
        return response.json();
    },

    async getAllReports() {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/reports/all`, {
            method: 'GET',
            headers: authHeader
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Fetching all reports failed:', error);
            throw new Error(error.error || 'Failed to fetch all reports');
        }

        return response.json();
    },

    async downloadReportFile(reportId: number): Promise<Blob> {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/reports/${reportId}/download`, {
            method: 'GET',
            headers: authHeader
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Downloading report file failed:', error);
            throw new Error(error.error || 'Failed to download report file');
        }

        return response.blob();
    }
};

// Analytics API
export const analyticsAPI = {
    async getDashboardAnalytics() {
        const response = await fetch(`${BASE_URL}/api/v1/analytics`, {
            method: "GET",
            headers: getAuthHeader()
        });

        if (!response.ok) throw new Error("Failed to fetch analytics");
        return response.json();
    },

    async getAnalyticsByOperatorId(operatorId: number | null) {

        const url =
            operatorId === null
                ? `${BASE_URL}/api/v1/analytics`
                : `${BASE_URL}/api/v1/analytics/operator/${operatorId}`;

        const response = await fetch(url, {
            method: "GET",
            headers: getAuthHeader()
        });

        if (!response.ok) throw new Error("Failed to fetch analytics");

        return response.json();
    },

    async getDataQuality() {
        const response = await fetch(`${BASE_URL}/analytics/data-quality`, {
            method: "GET",
            headers: getAuthHeader()
        });

        if (!response.ok) throw new Error("Failed to fetch data quality");
        return response.json();
    }
};

export const managementAPI = {
    async getOperators() {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/operators`, {
            method: 'GET',
            headers: authHeader
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Fetching operators failed:', error);
            throw new Error(error.error || 'Failed to fetch operators');
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    generateMonthlySummary: async (month: string) => {
        const res = await fetch(`${BASE_URL}/api/v1/reports/summary/monthly/${month}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) throw new Error("Failed to generate PDF");

        return await res.json();
    },

    async createOperator(operatorData: { operator_name: string; license_number: string }) {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/operators/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify(operatorData)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Creating operator failed:', error);
            throw new Error(error.error || 'Failed to create operator');
        }

        return response.json();
    },

    async getUsers() {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/users`, {
            method: 'GET',
            headers: authHeader
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Fetching users failed:', error);
            throw new Error(error.error || 'Failed to fetch users');
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    async createUser(userData: {
        email: string;
        full_name: string;
        password: string;
        operator_id: number | null;
        role: string;
    }) {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/users/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Creating user failed:', error);
            throw new Error(error.error || 'Failed to create user');
        }

        return response.json();
    },

    async toggleUserStatus(userId: number, isActive: boolean) {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/management/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify({ is_active: isActive })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Updating user status failed:', error);
            throw new Error(error.error || 'Failed to update user status');
        }

        return response.json();
    }
};