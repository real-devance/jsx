import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Papa from "papaparse";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Gauge,
  Layers3,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";

const MAX_METERS = 100;

const formSchema = z.object({
  meterInput: z.string(),
  meterNumbers: z
    .array(z.string().min(1, "Meter number cannot be empty"))
    .min(1, "Add at least one meter number")
    .max(MAX_METERS, `You can add up to ${MAX_METERS} meter numbers`),
  formType: z.string().min(1, "Please select a form type"),
});

type FormValues = z.infer<typeof formSchema>;

const FORM_TYPES = [
  { value: "type-a", label: "Type A" },
  { value: "type-b", label: "Type B" },
  { value: "type-c", label: "Type C" },
];

export default function ConsolidatedMeterForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFileName, setCsvFileName] = useState("");

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      meterInput: "",
      meterNumbers: [],
      formType: "",
    },
    mode: "onSubmit",
  });

  const meterNumbers = watch("meterNumbers");
  const meterInput = watch("meterInput");
  const count = meterNumbers.length;

  function updateMeters(nextMeters: string[]) {
    setValue("meterNumbers", nextMeters, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    clearErrors("meterNumbers");
  }

  function addMeter() {
    const meter = meterInput.trim();

    if (!meter) {
      setError("meterInput", {
        type: "manual",
        message: "Enter a meter number first",
      });
      return;
    }

    if (meterNumbers.includes(meter)) {
      setError("meterInput", {
        type: "manual",
        message: "This meter number is already in the list",
      });
      return;
    }

    if (count >= MAX_METERS) {
      setError("meterInput", {
        type: "manual",
        message: `You can add a maximum of ${MAX_METERS} meters`,
      });
      return;
    }

    updateMeters([...meterNumbers, meter]);
    setValue("meterInput", "");
    clearErrors("meterInput");
  }

  function removeMeter(meterToRemove: string) {
    updateMeters(meterNumbers.filter((meter) => meter !== meterToRemove));
  }

  function clearAllMeters() {
    updateMeters([]);
  }

  function handleCsvUpload(file?: File) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file.");
      return;
    }

    Papa.parse<string[]>(file, {
      skipEmptyLines: "greedy",
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("Could not read the CSV file. Please check its format.");
          return;
        }

        const rows = results.data;
        const firstCell = String(rows[0]?.[0] ?? "").trim().toLowerCase();
        const hasHeader = [
          "meter",
          "meter no",
          "meter number",
          "meterno",
          "meter_no",
        ].includes(firstCell);

        const imported = rows
          .slice(hasHeader ? 1 : 0)
          .map((row) => String(row[0] ?? "").trim())
          .filter(Boolean);

        if (imported.length === 0) {
          toast.error("No meter numbers found in the first CSV column.");
          return;
        }

        const existing = getValues("meterNumbers");
        const seen = new Set(existing);
        const uniqueNew: string[] = [];

        for (const meter of imported) {
          if (!seen.has(meter)) {
            seen.add(meter);
            uniqueNew.push(meter);
          }
        }

        const availableSlots = MAX_METERS - existing.length;
        const accepted = uniqueNew.slice(0, availableSlots);
        const skipped = imported.length - accepted.length;

        updateMeters([...existing, ...accepted]);
        setCsvFileName(file.name);

        if (accepted.length > 0) {
          toast.success(
            `${accepted.length} meter number${accepted.length === 1 ? "" : "s"} added from CSV.`,
          );
        } else {
          toast.info("No new meter numbers were added.");
        }

        if (skipped > 0) {
          toast.warning(
            `${skipped} row(s) skipped because they were duplicates or the 100-meter limit was reached.`,
          );
        }
      },
      error: () => toast.error("Unable to read this CSV file."),
    });
  }

  async function onSubmit(values: FormValues) {
    // Replace this with your API call.
    console.log("Consolidated meter form:", {
      meterNumbers: values.meterNumbers,
      formType: values.formType,
    });

    toast.success("Form is valid. Connect your API to submit the data.");
  }

  function handleReset() {
    reset({
      meterInput: "",
      meterNumbers: [],
      formType: "",
    });
    setCsvFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Card className="mx-auto w-full max-w-5xl border-slate-200 shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
            <Layers3 className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Consolidated Meter Form
            </CardTitle>
            <CardDescription className="mt-1">
              Add meter numbers manually or import them from a CSV file.
              Select a type and submit the consolidated form.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Meter entry and CSV upload */}
          <div className="grid gap-5 md:grid-cols-[1.3fr_1fr] md:items-end">
            <div className="space-y-2">
              <label
                htmlFor="meterInput"
                className="text-sm font-medium text-slate-900"
              >
                Meter Number
              </label>

              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Gauge className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="meterInput"
                    placeholder="Enter meter number"
                    className="pl-9"
                    {...register("meterInput")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addMeter();
                      }
                    }}
                    aria-invalid={!!errors.meterInput}
                  />
                </div>

                <Button type="button" onClick={addMeter} className="shrink-0">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add
                </Button>
              </div>

              {errors.meterInput && (
                <p className="text-xs text-destructive">
                  {errors.meterInput.message}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-dashed border-violet-300 bg-violet-50/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => {
                      handleCsvUpload(event.target.files?.[0]);
                      // Allows selecting the same file again.
                      event.target.value = "";
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-semibold text-violet-700 underline underline-offset-4 hover:text-violet-900"
                  >
                    Upload CSV file
                  </button>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Reads meter numbers from the first column
                  </p>
                  {csvFileName && (
                    <p className="mt-1 max-w-56 truncate text-xs text-slate-600">
                      {csvFileName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Scrollable meter list */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Added Meters
                </h3>
                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-violet-700">
                  {count} / {MAX_METERS}
                </span>
              </div>

              {count > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllMeters}
                  className="text-slate-500 hover:text-destructive"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-3">
              {count === 0 ? (
                <div className="flex min-h-24 items-center justify-center text-sm text-slate-500">
                  No meter numbers added yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {meterNumbers.map((meter) => (
                    <div
                      key={meter}
                      className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Gauge className="h-4 w-4 shrink-0 text-violet-500" />
                        <span className="truncate text-sm font-medium text-slate-800">
                          {meter}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeMeter(meter)}
                        aria-label={`Remove ${meter}`}
                        className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>You can add up to {MAX_METERS} meter numbers.</span>
              <span className="tabular-nums">{count} added</span>
            </div>

            {errors.meterNumbers && (
              <p className="text-xs text-destructive">
                {errors.meterNumbers.message}
              </p>
            )}
          </section>

          <Separator />

          {/* Consolidated form type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">
              Type for Consolidated Form
            </label>

            <Controller
              name="formType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.formType}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            {errors.formType && (
              <p className="text-xs text-destructive">
                {errors.formType.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t border-slate-100 pt-5">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            Submit
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
