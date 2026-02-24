import { useState, useEffect } from "react";
import AddModuleForm from "./addModuleForm";
import ModuleGrid from "./addModuleGrid";
import { deleteItem, getAllModules } from "../../../../Services/addModule";
import { deleteAlert, showAlert } from "../../../../Components/swal_alert";
import CircularBubbleLoading from "../../../../Components/loading";
import { Grid } from "@mui/material";
/**
 * AddModuleMaster
 * Parent/master component for the Module management section.
 * Manages shared state between the form and the grid,
 * including edit mode, row data, loading state, and delete handling.
 */
const AddModuleMaster = () => {
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  /**
   * Fetches all module records from the API
   * and updates the grid rows.
   */
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getAllModules();
      setRows(response?.items || []);
    } catch (error) {
      console.error("Error loading modules", error);
    } finally {
      setLoading(false);
    }
  };

  // Load all modules on initial mount
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Prompts the user for confirmation, then deletes the selected module.
   * Refreshes the grid on successful deletion.
   */
  const handleDeleteFromGrid = async (row) => {
    const result = await deleteAlert(
      "Are you sure?",
      `Delete "${row.module_name}"?`,
    ); // lowercase
    if (!result.isConfirmed) return;

    try {
      const res = await deleteItem(row.module_menu_id); // lowercase
      if (res?.Status === 1) {
        loadData();
      } else {
        showAlert("warning", res?.Message || "Delete failed");
      }
    } catch {
      showAlert("error", "Something went wrong during delete");
    }
  };

  /**
   * Sets the selected row into edit mode when
   * the edit icon is clicked in the grid.
   */
  const handleEditFromGrid = (row) => setEditingItem(row);

  /**
   * Clears edit mode after the form save, update, or clear action.
   */
  const handleEditComplete = () => setEditingItem(null);

  return (
    <>
      {/* Full-screen loader shown during API fetch */}
      {loading && <CircularBubbleLoading />}
      <Grid container spacing={2} mb={2}>
        {/* Form section — switches between Add and Edit mode */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <AddModuleForm
            editingItem={editingItem}
            onEditComplete={handleEditComplete}
            onRequestRefresh={loadData}
          />
        </Grid>
        {/* Grid section — displays all module records */}
        <Grid size={{ xs: 12, sm: 12, md: 5.8 }}>
          <ModuleGrid
            rows={rows}
            onEdit={handleEditFromGrid}
            onDelete={handleDeleteFromGrid}
            loading={loading}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default AddModuleMaster;
