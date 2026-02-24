import React, { useState, useEffect, useCallback } from "react";
import { Grid, Paper, Typography, Box } from "@mui/material";
import SubMenuForm from "./SubMenuForm";
import SubMenuGrid from "./SubMenuGrid";
import CircularBubbleLoading from "../../../../Components/loading";
import {
  fetchgriddata,
  deleteItem,
} from "../../../../Services/submenu.services";
import {
  showPostSuccess,
  deleteAlert,
  showError,
} from "../../../../Components/swal_alert";

/**
 * SubMenuMaster
 * Parent/master component for the Submenu management section.
 * Manages shared state between the form and the grid,
 * including edit mode, row data, loading state, and delete handling.
 */
export default function SubMenuMaster() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState(null);

  /**
   * Prompts the user for confirmation, then deletes the selected submenu row.
   * Removes the deleted row from local state on success to avoid a full refetch.
   */
  const handleDelete = async (row) => {
    const confirmed = await deleteAlert(
      "Are you sure?",
      `Do you want to delete "${row.sub_menue_name}"?`,
    );

    // Abort if the user cancelled the confirmation dialog
    if (!confirmed) return;

    try {
      let res = await deleteItem(Number(row.sub_menue_item_id));
      if (res?.Status === 1) {
        showPostSuccess("Deleted successfully", res?.Message);
        // Remove the deleted row from state without refetching the full list
        setRows((prev) =>
          prev.filter(
            (item) => item.sub_menue_item_id !== row.sub_menue_item_id,
          ),
        );
      }
    } catch (error) {
      console.error("Delete error:", error);
      showError("Failed to delete submenu");
    }
  };

  /**
   * Fetches all submenu records from the API
   * and updates the grid rows.
   */
  const fetchAllData = async () => {
    try {
      let res = await fetchgriddata();
      setRows(res?.items || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load all submenu records on initial mount
  useEffect(() => {
    fetchAllData();
  }, []);

  /**
   * Derives a unique row ID for the DataGrid.
   * Falls back to row.id, then a random value if neither field is present.
   */
  const getRowId = (row) => row.sub_menue_item_id || row.id || Math.random();

  return (
    <>
      {/* Full-screen loader shown while grid data is being fetched */}
      {loading && <CircularBubbleLoading />}

      <Grid container spacing={3}>
        {/* Form section — switches between Add and Edit mode based on editItem */}
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <Paper sx={{ p: 3 }}>
            <SubMenuForm
              fetchAllData={fetchAllData}
              editItem={editItem}
              clearEdit={() => setEditItem(null)}
            />
          </Paper>
        </Grid>

        {/* Grid section — displays all submenu records */}
        <Grid size={{ xs: 12, sm: 12, md: 10 }}>
          <Paper sx={{ p: 3 }}>
            <SubMenuGrid
              rows={rows}
              loading={loading}
              getRowId={getRowId}
              onDelete={handleDelete}
              // Maps the raw grid row fields to the uppercase keys
              // expected by SubMenuForm when populating edit mode
              onEdit={(row) =>
                setEditItem({
                  ID: row.sub_menue_item_id,
                  SUB_MENUE_NAME: row.sub_menue_name,
                  PAGE_NAME_NAVIGATION: row.page_name_navigation,
                  ICON: row.icon,
                  MENUE_ITEM_ID: row.menue_item_id,
                  POSITION: row.position,
                })
              }
            />
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
