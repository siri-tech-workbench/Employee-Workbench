import React, { useState, useEffect, useCallback } from "react";
import {
  Grid,
  Typography,
  TextField,
  Button,
  Box,
  Autocomplete,
} from "@mui/material";
import CircularBubbleLoading from "../../../../Components/loading";
import { z } from "zod";
import Validation from "../../../../Components/validation";
import { showAlert } from "../../../../Components/swal_alert";

import {
  fetchmodule,
  createItem,
  updateItem,
} from "../../../../Services/submenu.services";

/**
 * SubMenuForm
 * Renders a form to add or edit a submenu entry.
 * Loads the menu item dropdown dynamically from the API.
 *
 * Props:
 *   fetchAllData - Callback to reload the grid after save or update.
 *   editItem     - The item object to edit. If null, form is in add mode.
 *   clearEdit    - Callback to clear the edit state in the parent.
 */
export default function SubMenuForm({ fetchAllData, editItem, clearEdit }) {
  const [circularloading, setcircularLoading] = useState(false);
  const [dd_modules, setddmodules] = useState([]);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    sub_menu_name: "",
    icon: "",
    page_name_navigation: "",
    menu_items_id: "",
    position: "",
  });

  /**
   * Validation schema for the submenu form.
   * Enforces required strings and a numeric-only position value.
   */
  const schema = z.object({
    sub_menu_name: z.string().min(1, "Please enter Submenu Name"),
    icon: z.string().min(1, "Please enter Icon Name"),
    page_name_navigation: z.string().min(1, "Please enter Page Navigation"),
    menu_items_id: z.number().min(1, "Please select Menu"),
    position: z.string().regex(/^[0-9]+$/, "Position must be a number"),
  });

  /**
   * Validates all form fields against the schema.
   * Returns true if all fields pass, false otherwise.
   */
  const validateForm = () => {
    const { isValid, errors } = Validation(formData, schema);
    setErrors(errors);
    return isValid;
  };

  /**
   * Updates a single form field and validates it inline.
   * Shows a per-field error immediately on change.
   */
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    try {
      schema.shape[field].parse(value);
      setErrors((prev) => ({ ...prev, [field]: "" }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [field]: err.errors?.[0]?.message || "Invalid input",
      }));
    }
  };

  /**
   * Normalizes various API response shapes into a flat array.
   * Handles cases where items may be nested under data or returned directly.
   */
  const normalizeList = (payload) =>
    Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  /**
   * Fetches menu item dropdown options from the API
   * and stores them in state for the Autocomplete.
   */
  const loadDropdownData = async () => {
    try {
      const res = await fetchmodule();
      setddmodules(res?.items || []);
    } catch {
      showAlert("error", "Failed to load dropdown data");
    }
  };

  // Load the menu item dropdown on component mount
  useEffect(() => {
    loadDropdownData();
  }, []);

  // Populate form fields when an item is selected for editing
  useEffect(() => {
    if (editItem) {
      setFormData({
        sub_menu_name: editItem.SUB_MENUE_NAME || "",
        icon: editItem.ICON || "",
        page_name_navigation: editItem.PAGE_NAME_NAVIGATION || "",
        menu_items_id: Number(editItem.MENUE_ITEM_ID || ""),
        position: editItem.POSITION || "",
      });
    }
  }, [editItem]);

  /* ------------ SAVE ------------ */
  /**
   * Validates and submits the form to create a new submenu item.
   * Refreshes the grid and clears the form on success.
   */
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setcircularLoading(true);

      const payload = {
        SUB_MENUE_NAME: formData.sub_menu_name,
        ICON: formData.icon,
        PAGE_NAME_NAVIGATION: formData.page_name_navigation,
        MENUE_ITEMS_ID: Number(formData.menu_items_id),
        POSITION: Number(formData.position),
      };

      const response = await createItem(payload);

      showAlert("success", "Item saved successfully");
      fetchAllData?.();
      handleClear();
    } catch (err) {
      console.error(err);

      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors ||
        "Failed to save item";

      showAlert("error", msg);
    } finally {
      setcircularLoading(false);
    }
  };

  /* ------------ UPDATE ------------ */
  /**
   * Validates and submits the form to update an existing submenu item.
   * Requires a valid edit ID before proceeding.
   */
  const handleUpdate = async () => {
    if (!validateForm()) return;

    if (!editItem?.ID) {
      return showAlert("warning", "Invalid Edit ID");
    }

    try {
      setcircularLoading(true);

      const payload = {
        ID: editItem.ID,
        SUB_MENUE_NAME: formData.sub_menu_name,
        ICON: formData.icon,
        PAGE_NAME_NAVIGATION: formData.page_name_navigation,
        MENUE_ITEMS_ID: Number(formData.menu_items_id),
        POSITION: Number(formData.position),
      };

      await updateItem(editItem.ID, payload);

      showAlert("success", "Updated successfully");
      fetchAllData?.();
      handleClear();
      clearEdit?.();
    } catch (err) {
      console.error("Update Error:", err.response?.data || err);
      showAlert("error", "Failed to update item");
    } finally {
      setcircularLoading(false);
    }
  };

  /**
   * Resets all form fields, errors, and notifies
   * the parent to clear the edit state.
   */
  const handleClear = () => {
    setFormData({
      sub_menu_name: "",
      icon: "",
      page_name_navigation: "",
      menu_items_id: "",
      position: "",
    });
    setErrors({});
    clearEdit?.();
  };

  // Derive edit mode from whether any known ID field exists on the edit item
  const isEditMode = Boolean(
    editItem?.SUB_MENUE_ID ||
    editItem?.SUB_MENU_ID ||
    editItem?.Menue_Id ||
    editItem?.ID,
  );

  return (
    <>
      {/* Full-screen loader shown during API calls */}
      {circularloading && <CircularBubbleLoading />}

      <Grid container spacing={2}>
        {/* Form title changes based on add or edit mode */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <Typography variant="h6">
            {isEditMode ? "Edit Sub Menu" : "Add Sub Menu"}
          </Typography>
        </Grid>

        {/* Menu item selection dropdown — populated from the API */}
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <Autocomplete
            size="small"
            fullWidth
            options={dd_modules}
            getOptionLabel={(o) => o.menue_item_name || ""}
            value={
              dd_modules.find(
                (m) =>
                  Number(m.menue_item_id) === Number(formData.menu_items_id),
              ) || null
            }
            onChange={(e, v) =>
              handleFieldChange(
                "menu_items_id",
                v ? Number(v.menue_item_id) : null,
              )
            }
            isOptionEqualToValue={(option, value) =>
              Number(option.menue_item_id) === Number(value.menue_item_id)
            }
            renderOption={(props, option) => (
              <li {...props} key={option.menue_item_id}>
                {" "}
                {/* lowercase, guaranteed number */}
                {option.menue_item_name}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Menu"
                error={!!errors.menu_items_id}
                helperText={errors.menu_items_id}
              />
            )}
          />
        </Grid>

        {/* Submenu name input */}
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <TextField
            size="small"
            fullWidth
            label="Submenu Name"
            value={formData.sub_menu_name}
            required
            onChange={(e) => handleFieldChange("sub_menu_name", e.target.value)}
            error={!!errors.sub_menu_name}
            helperText={errors.sub_menu_name}
          />
        </Grid>

        {/* Icon name input */}
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <TextField
            size="small"
            fullWidth
            label="Icon"
            required
            value={formData.icon}
            onChange={(e) => handleFieldChange("icon", e.target.value)}
            error={!!errors.icon}
            helperText={errors.icon}
          />
        </Grid>

        {/* Page navigation route name input */}
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <TextField
            size="small"
            fullWidth
            label="Page Navigation"
            required
            value={formData.page_name_navigation}
            onChange={(e) =>
              handleFieldChange("page_name_navigation", e.target.value)
            }
            error={!!errors.page_name_navigation}
            helperText={errors.page_name_navigation}
          />
        </Grid>

        {/* Position order input (numeric only, validated by schema) */}
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <TextField
            size="small"
            fullWidth
            label="Position"
            required
            value={formData.position}
            onChange={(e) => handleFieldChange("position", e.target.value)}
            error={!!errors.position}
            helperText={errors.position}
          />
        </Grid>

        {/* Save, Update, and Clear action buttons */}
        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            {/* Save is disabled in edit mode */}
            <Button
              variant="contained"
              size="small"
              disabled={isEditMode}
              onClick={handleSave}
            >
              Save
            </Button>

            {/* Update is disabled when not in edit mode */}
            <Button
              variant="contained"
              size="small"
              disabled={!isEditMode}
              onClick={handleUpdate}
            >
              Update
            </Button>

            <Button
              variant="contained"
              size="small"
              color="error"
              onClick={handleClear}
            >
              Clear
            </Button>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
