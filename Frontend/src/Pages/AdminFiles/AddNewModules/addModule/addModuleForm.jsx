import { useState, useEffect } from "react";
import { Grid, Paper, Typography, TextField, Button, Box } from "@mui/material";
import Loading from "../../../../Components/loading";
import { z } from "zod";
import { showAlert } from "../../../../Components/swal_alert";
import { createItem, updateItem } from "../../../../Services/addModule";

/**
 * Validation schema for the module form.
 * Defined outside the component to avoid recreation on every render.
 */
const schema = z.object({
  module_name: z.string().min(3, "Module name must be at least 3 characters"),
  icons: z.string().min(3, "Icon must be at least 3 characters"),
});

/**
 * AddModuleForm
 * Renders a form to add or edit a module entry.
 *
 * Props:
 *   editingItem      - The item object to edit. If null, form is in add mode.
 *   onEditComplete   - Callback invoked after edit is completed or cleared.
 *   onRequestRefresh - Callback to refresh the parent list after save or update.
 */
export default function AddModuleForm({
  editingItem,
  onEditComplete,
  onRequestRefresh,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    MODULE_MENU_ID: "",
    module_name: "",
    icons: "",
  });

  const [errors, setErrors] = useState({});

  // Derive edit mode from whether an editing item exists
  const isEditMode = Boolean(editingItem);

  /**
   * Populates the form fields when an item is selected for editing.
   * Clears the form when editingItem is reset to null.
   */
  useEffect(() => {
    if (editingItem) {
      setFormData({
        // MODULE_MENU_ID is stored to reference the record during the update API call
        MODULE_MENU_ID: editingItem.module_menu_id,
        module_name: editingItem.module_name,
        icons: editingItem.icon,
      });
    } else {
      setFormData({ MODULE_MENU_ID: "", module_name: "", icons: "" });
      setErrors({});
    }
  }, [editingItem]);

  /**
   * Validates all form fields against the schema.
   * Returns true if all fields pass, false otherwise.
   */
  const validateForm = () => {
    try {
      schema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      console.error("Validation error:", err);
      const formatted = {};
      err.issues.forEach((e) => (formatted[e.path[0]] = e.message));
      setErrors(formatted);
      return false;
    }
  };

  /**
   * Updates a single form field value and validates it inline.
   * Shows per-field error immediately on change.
   */
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    try {
      schema.shape[field].parse(value);
      setErrors((prev) => ({ ...prev, [field]: "" }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [field]: err.issues?.[0]?.message || "Invalid value",
      }));
    }
  };

  /**
   * Resets all form fields, errors, and notifies
   * the parent to clear the edit state.
   */
  const handleClear = () => {
    setFormData({ MODULE_MENU_ID: "", module_name: "", icons: "" });
    setErrors({});
    onEditComplete?.();
  };

  /**
   * Validates the form and either creates a new module
   * or updates an existing one based on the current mode.
   * Refreshes the parent list and clears the form on success.
   */
  const handleSave = async () => {
    if (!validateForm()) return;

    const payload = {
      module_name: formData.module_name,
      icon: formData.icons,
    };

    try {
      setIsLoading(true);

      let response;

      if (isEditMode) {
        response = await updateItem(formData.MODULE_MENU_ID, payload);
      } else {
        response = await createItem(payload);
      }

      if (response?.Status === 1) {
        showAlert(
          "success",
          isEditMode
            ? "Module updated successfully"
            : "Module saved successfully",
        );
        handleClear();
        onRequestRefresh?.();
      } else {
        showAlert(
          "warning",
          response?.Message || (isEditMode ? "Update failed" : "Save failed"),
        );
      }
    } catch {
      console.error("Something went wrong");
      showAlert("error", "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Full-screen loader shown during API calls */}
      {isLoading && <Loading />}

      <Paper elevation={3} sx={{ p: 2, width: "100%", maxWidth: "600px" }}>
        <Grid container spacing={2}>
          {/* Form title changes based on add or edit mode */}
          <Grid size={{ xs: 12, sm: 12, md: 12 }}>
            <Typography variant="h6">
              {isEditMode ? "Edit Module" : "Add Module"}
            </Typography>
          </Grid>

          {/* Module name input */}
          <Grid size={{ xs: 12, sm: 12, md: 4 }}>
            <TextField
              size="small"
              fullWidth
              label="Module Name"
              required
              value={formData.module_name}
              onChange={(e) => handleFieldChange("module_name", e.target.value)}
              error={!!errors.module_name}
              helperText={errors.module_name}
            />
          </Grid>

          {/* Icon name input */}
          <Grid size={{ xs: 12, sm: 12, md: 4 }}>
            <TextField
              size="small"
              fullWidth
              label="Icon"
              required
              value={formData.icons}
              onChange={(e) => handleFieldChange("icons", e.target.value)}
              error={!!errors.icons}
              helperText={errors.icons}
            />
          </Grid>

          {/* Save/Update and Clear action buttons */}
          <Grid size={{ xs: 12, sm: 12, md: 1 }} sx={{ textAlign: "right" }}>
            <Box sx={{ display: "inline-flex", gap: 1 }}>
              <Button variant="contained" size="small" onClick={handleSave}>
                {isEditMode ? "Update" : "Save"}
              </Button>

              <Button
                variant="contained"
                color="error"
                size="small"
                onClick={handleClear}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
}
