import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
    isLoading: false,
    issues: [],
    issue: null,
};

// Fetch all issues
export const fetchIssues = createAsyncThunk("/issues", async () => {
    const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/issues/all`
    );
    return response.data;
});

// Add a new issue
export const addIssue = createAsyncThunk(
    "/issues/report",
    async (formData) => {
        const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/issues/report`,
            formData,
            {
                withCredentials: true, // Ensure authentication
            }
        );
        return response.data;
    }
);

const issueSlice = createSlice({
    name: "issue",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Issues actions
            .addCase(fetchIssues.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchIssues.fulfilled, (state, action) => {
                state.isLoading = false;
                // Check if issues exist in the response and set them
                state.issues = action.payload?.issues || [];
            })
            .addCase(fetchIssues.rejected, (state, action) => {
                state.isLoading = false;
                console.error(`Failed to fetch issues: ${action.error.message}`);
            })

            // Add Issue actions
            .addCase(addIssue.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(addIssue.fulfilled, (state, action) => {
                state.isLoading = false;
                // Push the newly added issue into the issues array
                if (action.payload?.issue) {
                    state.issues.push(action.payload.issue);
                }
            })
            .addCase(addIssue.rejected, (state, action) => {
                state.isLoading = false;
                console.error(`Failed to add issue: ${action.error.message}`);
            });
    },
});

export default issueSlice.reducer;
