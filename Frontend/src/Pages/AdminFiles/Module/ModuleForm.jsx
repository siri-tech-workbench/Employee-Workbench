import { useEffect, useState } from "react";
import { Button, Grid, Paper, TextField } from "@mui/material";
import { z } from "zod";

import { insertmodule, updatemodule } from "../../../Services/module.service";

import { showPostError, showAlert } from "../../../Components/swal_alert";
import Loading from "../../../Components/loading";

/* =========================================================
   Validation Schema
========================================================= */
const moduleSchema = z.object({
  module_name: z.string().trim().min(1, "Module name is required"),
});

/* =========================================================
   Module Form Component
========================================================= */
export default function ModuleForm({ editUser, clearEdit, onSuccess }) {
  const [moduleName, setModuleName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* -------------------------------------------------------
     Populate form when editing
  ------------------------------------------------------- */
  useEffect(() => {
    if (editUser) {
      setModuleName(editUser.module_name || "");
      setError("");
    }
  }, [editUser]);

  /* -------------------------------------------------------
     Clear form
  ------------------------------------------------------- */
  const handleClear = () => {
    setModuleName("");
    setError("");
  };

  /* -------------------------------------------------------
     Submit Handler
  ------------------------------------------------------- */
  const handleSubmit = async () => {
    const validation = moduleSchema.safeParse({
      module_name: moduleName,
    });

    if (!validation.success) {
      setError(validation.error.errors[0]?.message);
      return;
    }

    setLoading(true);

    const payload = {
      MODULE_NAME: validation.data.module_name,
    };

    try {
      let response;

      if (editUser) {
        response = await updatemodule(editUser.MODULE_ID, payload);
      } else {
        response = await insertmodule(payload);
      }

      const success = response?.Status === 1 || response?.statusCode === 200;

      if (!success) {
        showPostError(response?.message || "Operation failed");
        return;
      }

      await showAlert(
        "success",
        editUser
          ? "Module updated successfully"
          : "Module created successfully",
      );

      onSuccess();
      handleClear();
      clearEdit?.();
    } catch (err) {
      console.error("Module save failed", err);

      await showAlert(
        "error",
        err?.response?.data?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */
  return (
    <>
      {loading && <Loading />}

      <Grid container spacing={2} component={Paper} p={2} mb={2}>
        <Grid xs={12} md={8}>
          <TextField
            label="Module Name"
            fullWidth
            value={moduleName}
            onChange={(e) => {
              setModuleName(e.target.value);
              if (error) setError("");
            }}
            error={!!error}
            helperText={error}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <Button
            variant="contained"
            size="small"
            color="secondary"
            fullWidth
            onClick={handleSubmit}
          >
            {editUser ? "Update Module" : "Add Module"}
          </Button>
        </Grid>
      </Grid>
    </>
  );
}
