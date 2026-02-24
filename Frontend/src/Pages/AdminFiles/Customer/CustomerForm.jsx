import { Grid, TextField, Paper, Button, Box } from "@mui/material";
import { z } from "zod";
import { useState, useEffect } from "react";
import {
  postcustomer,
  updatecustomer,
} from "../../../Services/customer.service";
import Loading from "../../../Components/loading";
import { showPostError, showAlert } from "../../../Components/swal_alert";

/**
 * Validation schema for the customer form.
 * Transforms all string fields to uppercase on successful parse.
 * Exported for reuse in CustomerTable or other consumers if needed.
 */
export const customerSchema = z.object({
  customerName: z
    .string()
    .min(3, "Customer Name must be at least 3 characters")
    .transform((v) => v.toUpperCase()),
  customerAlias: z
    .string()
    .min(3, "Customer Alias must be at least 3 characters")
    .transform((v) => v.toUpperCase()),
  city: z
    .string()
    .min(3, "City must be at least 3 characters")
    .regex(/^[A-Z\s]+$/, "City must contain only letters")
    .transform((v) => v.toUpperCase()),
  pan: z
    .string()
    .length(10, "PAN must be exactly 10 characters")
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "PAN must be in format ABCDE1234F")
    .transform((v) => v.toUpperCase()),
  gst: z
    .string()
    .length(15, "GST must be exactly 15 characters")
    .regex(/^[A-Z0-9]+$/, "GST must be alphanumeric")
    .transform((v) => v.toUpperCase()),
});

/**
 * CustomerForm
 * Renders a form to add or edit a customer record.
 * All text inputs are auto-uppercased and validated inline on change.
 *
 * Props:
 *   editUser  - The customer object to edit. If null, form is in add mode.
 *   clearEdit - Callback to clear the edit state in the parent.
 *   onSuccess - Callback to refresh the customer table after save or update.
 */
export default function CustomerForm({ editUser, clearEdit, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    customerName: "",
    customerAlias: "",
    city: "",
    pan: "",
    gst: "",
  });

  const isEditMode = Boolean(editUser);

  /**
   * Validates a single field value against its schema shape inline.
   * Updates the error state for that field on every change.
   */
  const validateField = (field, value) => {
    const fieldSchema = customerSchema.shape[field];
    if (!fieldSchema) return;

    const result = fieldSchema.safeParse(value);
    setErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.issues[0].message,
    }));
  };

  /**
   * Resets all form fields and errors,
   * and notifies the parent to clear the edit state.
   */
  const handleClear = () => {
    setFormData({
      customerName: "",
      customerAlias: "",
      city: "",
      pan: "",
      gst: "",
    });
    setErrors({});
    clearEdit();
  };

  // Populate form fields when a customer is selected for editing,
  // reset form when editUser is cleared
  useEffect(() => {
    if (editUser) {
      setFormData({
        customerName: editUser.customer_name || "",
        customerAlias: editUser.customer_alias || "",
        city: editUser.city || "",
        pan: editUser.pan_no || "",
        gst: editUser.gst_no || "",
      });
      setErrors({});
    } else {
      handleClear();
    }
  }, [editUser]);

  /**
   * Validates the full form and either creates a new customer
   * or updates an existing one based on the current mode.
   * Refreshes the parent table and clears the form on success.
   */
  const handleSave = async () => {
    const result = customerSchema.safeParse(formData);

    if (!result.success) {
      const formErrors = {};
      result.error.issues.forEach((issue) => {
        formErrors[issue.path[0]] = issue.message;
      });
      setErrors(formErrors);
      return;
    }

    const data = result.data;

    const payload = {
      customer_name: data.customerName,
      customer_alias: data.customerAlias,
      city: data.city,
      pan_no: data.pan,
      gst_no: data.gst,
    };

    try {
      setLoading(true);

      if (isEditMode) {
        const response = await updatecustomer(editUser.customer_id, payload);

        if (response?.Status === 1 || response?.statusCode === 200) {
          showAlert("success", "Customer updated successfully");
        } else {
          showPostError(response?.message || "Customer update failed");
          return;
        }
      } else {
        const response = await postcustomer(payload);

        if (response?.Status === 1 || response?.statusCode === 200) {
          showAlert("success", "Customer created successfully");
        } else {
          showPostError(response?.message || "Customer creation failed");
          return;
        }
      }

      // Refresh parent table and reset form on success
      onSuccess();
      handleClear();
    } catch (err) {
      console.error("Customer save failed", err);
      showAlert("error", err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Full-screen loader shown during API calls */}
      {loading && <Loading />}

      <Grid container spacing={2} component={Paper} p={2}>
        {/* Customer name input — letters and spaces only, auto-uppercased */}
        <Grid size={{ xs: 12, md: 12 }}>
          <TextField
            size="small"
            fullWidth
            label="Customer Name"
            value={formData.customerName}
            error={!!errors.customerName}
            helperText={errors.customerName}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z\s]*$/.test(value)) {
                setFormData((prev) => ({ ...prev, customerName: value }));
                validateField("customerName", value);
              }
            }}
          />
        </Grid>

        {/* Customer alias input — letters and spaces only, auto-uppercased */}
        <Grid size={{ xs: 12, md: 12 }}>
          <TextField
            size="small"
            fullWidth
            label="Customer Alias"
            value={formData.customerAlias}
            error={!!errors.customerAlias}
            helperText={errors.customerAlias}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z\s]*$/.test(value)) {
                setFormData((prev) => ({ ...prev, customerAlias: value }));
                validateField("customerAlias", value);
              }
            }}
          />
        </Grid>

        {/* City input — letters and spaces only, auto-uppercased */}
        <Grid size={{ xs: 12, md: 12 }}>
          <TextField
            size="small"
            fullWidth
            label="City"
            value={formData.city}
            error={!!errors.city}
            helperText={errors.city}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z\s]*$/.test(value)) {
                setFormData((prev) => ({ ...prev, city: value }));
                validateField("city", value);
              }
            }}
          />
        </Grid>

        {/* PAN number input — alphanumeric only, auto-uppercased */}
        <Grid size={{ xs: 12, md: 12 }}>
          <TextField
            size="small"
            fullWidth
            label="PAN Number"
            value={formData.pan}
            error={!!errors.pan}
            helperText={errors.pan}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z0-9]*$/.test(value)) {
                setFormData((prev) => ({ ...prev, pan: value }));
                validateField("pan", value);
              }
            }}
          />
        </Grid>

        {/* GST number input — alphanumeric only, auto-uppercased */}
        <Grid size={{ xs: 12, md: 12 }}>
          <TextField
            size="small"
            fullWidth
            label="GST Number"
            value={formData.gst}
            error={!!errors.gst}
            helperText={errors.gst}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              if (/^[A-Z0-9]*$/.test(value)) {
                setFormData((prev) => ({ ...prev, gst: value }));
                validateField("gst", value);
              }
            }}
          />
        </Grid>

        {/* Save/Update and Clear action buttons */}
        <Grid size={{ xs: 12, md: 12 }} sx={{ textAlign: "right" }}>
          <Button
            variant="contained"
            size="small"
            color="secondary"
            onClick={handleSave}
            sx={{ mr: 1 }}
          >
            {isEditMode ? "Update" : "Save"}
          </Button>
          <Button
            variant="contained"
            size="small"
            color="warning"
            onClick={handleClear}
          >
            Clear
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
