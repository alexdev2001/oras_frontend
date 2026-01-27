
import { tokenManager, getSecureErrorMessage, API_BASE_URL } from './security.ts';

const BASE_URL = API_BASE_URL;

// Helper to get auth header with enhanced security
function getAuthHeader(): Record<string, string> {
    const token = tokenManager.getToken();
    if (!token) return {};
    
    // Check if token is expired
    if (tokenManager.isTokenExpired(token)) {
        tokenManager.removeToken();
        window.location.href = '/'; // Redirect to login
        return {};
    }
    
    return { Authorization: `Bearer ${token}` };
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
            throw new Error(getSecureErrorMessage({ status: response.status, error: data.error }));
        }

        if (data.access_token) {
            tokenManager.setToken(data.access_token);
        }

        return data;
    },

    signout() {
        tokenManager.removeToken();
    },

    getSession() {
        return tokenManager.getToken();
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
    async submitReport(operatorId: number, uploadedBy: number, file: File, date: string) {

        // 1. Create a FormData object to handle the multipart request
        const formData = new FormData();
        // Append non-file parameters as strings
        formData.append('operator_id', operatorId.toString());
        formData.append('uploaded_by', uploadedBy.toString());
        formData.append('date', date);
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
            throw new Error(error.detail || error.error || 'Report submission failed');
        }

        return response.json();
    },

    async notifyAdmins(operatorId: number) {
        const response = await fetch(`${BASE_URL}/api/v1/notifications/report-submitted`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            },
            body: JSON.stringify({ operator_id: operatorId })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            console.error("Admin notification failed:", error);
            throw new Error(error?.error || "Failed to notify admins");
        }

        return response.json();
    },

    async notifyOperators(operatorId: number) {
        const authHeader = await getAuthHeader();

        const response = await fetch(`${BASE_URL}/api/v1/notifications/report-approved`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...authHeader
            },
            body: JSON.stringify({ operator_id: operatorId })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            console.error("Operator notification failed:", error);
            throw new Error(error?.error || "Failed to notify operators");
        }

        return response.json();
    },

    async downloadRegulatorExcel(regulatorId: number) {
        const response = await fetch(
            `${BASE_URL}/api/v1/regulator-report-summary?regulator_id=${regulatorId}`,
            {
                method: "GET",
                headers: {
                    ...(await getAuthHeader()),
                    Accept:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                },
            }
        );

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || "Failed to download Excel report");
        }

        return await response.blob();
    },

    async notifyReportRejection(operatorId: number, reason: string){
        const authHeader = await getAuthHeader();

        const response = await fetch(`${BASE_URL}/api/v1/notifications/report-rejected`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeader },
            body: JSON.stringify({
                operator_id: operatorId,
                rejection_reason: reason,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            console.error("Report rejection failed:", error);
            throw new Error(error?.error || "Failed to notify rejections");
        }

    },

    async getRegulatorMetrics() {
        const response = await fetch(`${BASE_URL}/api/v1/regulator-metrics`, {
            method: 'GET',
            headers: getAuthHeader()
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.error || "Failed to notify regulator metrics");
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
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader()
                }
            });

            if (!response.ok) throw new Error("Failed to review report");
            return response.json();
        }
    },

    async  fetchRegulatorName(regulatorId: number): Promise<string> {
        const res = await fetch(`${BASE_URL}/api/v1/regulators/${regulatorId}`);
        if (!res.ok) throw new Error("Failed to fetch regulator");
        const data = await res.json();
        return data.regulator_name;
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
    },

    async submitMetrics(
        month: string,
        submissionType: 'online' | 'offline',
        file: File,
        operatorId?: number,
    ) {
        if (!file) throw new Error('File object is missing.');

        const formData = new FormData();
        formData.append('month_year', month);
        formData.append('report_type_status', submissionType);
        formData.append('file', file);
        
        if (operatorId) {
            formData.append('operator_id', operatorId.toString());
        }

        const response = await fetch(`${BASE_URL}/api/v1/regulators/submit_metrics`, {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            let detail = 'Unknown submission error.';
            if (errorData.detail) {
                detail = typeof errorData.detail === 'string'
                    ? errorData.detail
                    : 'Check server logs or response JSON for details.';
            }

            throw new Error(`Submission failed: ${detail}`);
        }

        return response.json();
    },

    async getRegulatorReports() {
        const response = await fetch(`${BASE_URL}/api/v1/regulator-report`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
            }
        });
        if (!response.ok) {
            console.error("failed to fetch regulator reports");
        }
        return response.json();
    },

    async getRegulatorSubmissionData() {
        const response = await fetch(`${BASE_URL}/api/v1/regulator-report/submissions`, {
            method: 'GET',
            headers: getAuthHeader(),
        });

        if (!response.ok) {
            console.error("failed to fetch regulator submission data");
        }
        return response.json();
    },

    async getRegulatorSubmitFile(reportId: number):  Promise<Blob> {
        const response = await fetch(`${BASE_URL}/api/v1/regulator-report/${reportId}/download`, {
            method: 'GET',
            headers: getAuthHeader(),
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
    },

    async getRegulatorAnalytics(regulatorId: number) {
        const response = await fetch(`${BASE_URL}/api/v1/regulator-metrics/${regulatorId}/analytics`, {
            method: 'GET',
            headers: getAuthHeader()
        });

        if (!response.ok) throw new Error("failed to fetch regulator metrics");
        return response.json();
    },

    async getRegulatorAnalyticsAdmin() {
        const response = await fetch(`${BASE_URL}/api/v1/regulator-report/analytics`, {
            method: 'GET',
            headers: getAuthHeader()
        });

        if (!response.ok) throw new Error("Failed to fetch regulator metrics");
        return response.json();
    },

    async getRegulatorPredictions(params: {
        regulator: string;
        months: number;
    }) {
        const response = await fetch(
            `${BASE_URL}/api/v1/regulator-predictions`,
            {
                method: "POST",
                headers: {
                    ...getAuthHeader(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(params),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch regulator predictions");
        }

        return response.json();
    }
};

export const managementAPI = {
    async getOperators() {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/operators_magla`, {
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
        const response = await fetch(`${BASE_URL}/api/v1/operators_magla/`, {
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

    async updateUser(userId: number, userData: {
        email: string;
        full_name: string;
        password?: string;
        operator_id: number | null;
        roles: string[];
    }) {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Updating user failed:', error);
            throw new Error(error.error || 'Failed to update user');
        }

        return response.json();
    },

    async getRegulatorUsers(regulatorId: number) {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/users/regulator/${regulatorId}`, {
            method: 'GET',
            headers: authHeader
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Getting users failed:', error);
            throw new Error(error.error || 'Failed to update user');
        }

        return response.json();
    },

    async deleteUser(userId: number) {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/users/${userId}`, {
            method: 'DELETE',
            headers: authHeader
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Deleting user failed:', error);
            throw new Error(error.error || 'Failed to delete user');
        }

        return response.json();
    },

    async updateOperator(operatorId: number, operatorData: { operator_name: string; license_number: string }) {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/operators/${operatorId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify(operatorData)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Updating operator failed:', error);
            throw new Error(error.error || 'Failed to update operator');
        }

        return response.json();
    },

    async deleteOperator(operatorId: number) {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/operators/${operatorId}`, {
            method: 'DELETE',
            headers: authHeader
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Deleting operator failed:', error);
            throw new Error(error.error || 'Failed to delete operator');
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
        regulator_id: number | null;
        roles: string[];
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
    },

    async getRegulators() {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/regulators`, {
            method: 'GET',
            headers: authHeader
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Fetching regulators failed:', error);
            throw new Error(error.error || 'Failed to fetch regulators');
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    async createRegulator(regulatorData: { regulator_name: string; country: string }) {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/regulators`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify(regulatorData)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Creating regulator failed:', error);
            throw new Error(error.error || 'Failed to create regulator');
        }

        return response.json();
    },

    async updateRegulator(regulatorId: number, regulatorData: { regulator_name: string; country: string }) {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/regulators/${regulatorId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify(regulatorData)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Updating regulator failed:', error);
            throw new Error(error.error || 'Failed to update regulator');
        }

        return response.json();
    },

    async deleteRegulator(regulatorId: number) {
        const authHeader = await getAuthHeader();
        const response = await fetch(`${BASE_URL}/api/v1/regulators/${regulatorId}`, {
            method: 'DELETE',
            headers: authHeader
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Deleting regulator failed:', error);
            throw new Error(error.error || 'Failed to delete regulator');
        }

        return response.json();
    }
};