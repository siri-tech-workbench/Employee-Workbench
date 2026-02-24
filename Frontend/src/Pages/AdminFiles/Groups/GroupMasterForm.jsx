import { useState, useEffect } from "react";
import { Grid, TextField, Button, Paper, Typography } from "@mui/material";

import {
  postGroupMaster,
  updateGroupMaster,
} from "../../../Services/GroupMaster.services";

import {
  showPostSuccess,
  showPostError,
  showUpdateError,
  showUpdateSuccess,
} from "../../../Components/swal_alert";

/**
 * GroupMasterForm Component
 *
 * Handles:
 * - Creating new group
 * - Updating existing group
 * - Resetting form
 */
export default function GroupMasterForm({
  selectedRow,
  clearSelection,
  refreshGrid,
}) {
  const [groupId, setGroupId] = useState(null);
  const [groupName, setGroupName] = useState("");

  /* ----------------------------------------------------------
     RESET FORM
  ---------------------------------------------------------- */
  const resetForm = () => {
    setGroupId(null);
    setGroupName("");
    if (clearSelection) clearSelection();
  };

  /* ----------------------------------------------------------
     FILL FORM ON EDIT
  ---------------------------------------------------------- */
  useEffect(() => {
    if (selectedRow) {
      setGroupId(selectedRow.GROUP_ID);
      setGroupName(selectedRow.GROUP_NAME);
    }
  }, [selectedRow]);

  /* ----------------------------------------------------------
     VALIDATION
  ---------------------------------------------------------- */
  const validate = () => {
    if (!groupName.trim()) {
      showPostError("Group Name is required.");
      return false;
    }
    return true;
  };

  /* ----------------------------------------------------------
     SUBMIT HANDLER (CREATE / UPDATE)
  ---------------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      GROUP_NAME: groupName.trim(),
    };

    try {
      if (groupId) {
        // Update
        const res = await updateGroupMaster(groupId, payload);

        if (res?.Status === 1) {
          showUpdateSuccess("Group Name updated successfully.");
        }
      } else {
        // Create
        const res = await postGroupMaster(payload);

        if (res?.Status === 1) {
          showPostSuccess("Group Name added successfully.");
        }
      }

      resetForm();
      refreshGrid();
    } catch (error) {
      console.error(error);

      if (groupId) {
        showUpdateError("Error updating Group Name.");
      } else {
        showPostError("Error adding Group Name.");
      }
    }
  };

  /* ----------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */
  return (
    <>
      <Typography variant="h6" gutterBottom>
        User Groups
      </Typography>

      <Paper sx={{ p: 3, width: "100%", maxWidth: 500 }}>
        <Grid container spacing={3}>
          <Grid xs={12} md={8}>
            <TextField
              label="Group Name"
              size="small"
              fullWidth
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </Grid>

          <Grid xs={12} md={4} display="flex" gap={1}>
            <Button variant="contained" size="small" onClick={handleSubmit}>
              {groupId ? "Update" : "Save"}
            </Button>

            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={resetForm}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
}
