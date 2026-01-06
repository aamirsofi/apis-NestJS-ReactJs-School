const fs = require('fs');
const path = require('path');

// Read the original file
const filePath = path.join(__dirname, 'FeeRegistry.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// The new function
const newFunction = `  const handleRecordPayment = async () => {
    if (!studentDetails || !academicYearId) {
      setError("Missing required information to record payment");
      return;
    }

    const amountReceived = parseFloat(paymentFormData.amountReceived) || 0;
    if (isNaN(amountReceived) || amountReceived <= 0) {
      setError("Please enter a valid amount received");
      return;
    }

    // Check if using new multi-fee payment system
    if (
      selectedFeeHeads.size > 0 &&
      Object.keys(paymentAllocation).length > 0
    ) {
      // Multi-fee payment based on allocation
      const totalAllocated = Object.values(paymentAllocation).reduce(
        (sum, amt) => sum + amt,
        0
      );
      if (totalAllocated <= 0) {
        setError("Please select at least one fee head to pay");
        return;
      }

      setRecordingPayment(true);
      setError("");

      try {
        const netAmount =
          (parseFloat(paymentFormData.amountReceived) || 0) -
          (parseFloat(paymentFormData.discount) || 0);

        console.log("[Payment] Starting invoice-based payment:", {
          amountReceived: paymentFormData.amountReceived,
          discount: paymentFormData.discount,
          netAmount,
          paymentAllocation,
          selectedFeeHeads: Array.from(selectedFeeHeads),
        });

        // Handle Ledger Balance (feeStructureId = 0) separately
        let ledgerBalanceAdjustment = 0;
        if (paymentAllocation[0] > 0) {
          ledgerBalanceAdjustment = paymentAllocation[0];
          try {
            const currentBalance = parseFloat(
              studentDetails.openingBalance?.toString() || "0"
            );
            const newBalance = currentBalance - ledgerBalanceAdjustment;
            await api.instance.patch(
              \`/students/\${studentDetails.id}\`,
              { openingBalance: newBalance },
              { params: { schoolId: selectedSchoolId } }
            );
            console.log(
              \`Ledger balance adjusted: \${currentBalance} → \${newBalance}\`
            );
          } catch (err) {
            console.error("Failed to update ledger balance:", err);
          }
        }

        // Prepare fee allocations for invoice (exclude ledger balance)
        const allocations = prepareFeeAllocation(
          feeBreakdown,
          selectedFeeHeads,
          paymentAllocation,
          studentDetails.routeId
        );

        if (allocations.length === 0) {
          setError("No valid fees selected for payment");
          setRecordingPayment(false);
          return;
        }

        // Create invoice-based payment
        const result = await createInvoicePayment({
          studentId: studentDetails.id,
          academicYearId: academicYearId,
          schoolId: selectedSchoolId as number,
          feeAllocations: allocations,
          totalAmount: netAmount - ledgerBalanceAdjustment,
          discount: parseFloat(paymentFormData.discount) || 0,
          paymentMethod: paymentFormData.paymentMethod as any,
          paymentDate: paymentFormData.paymentDate,
          transactionId: paymentFormData.transactionId,
          notes: paymentFormData.notes,
        });

        if (result.success) {
          setSuccess(
            result.message || 
            \`Payment of ₹\${netAmount.toFixed(2)} recorded successfully!\`
          );
          setShowPaymentForm(false);
          setPaymentFormData({
            amountReceived: "",
            discount: "",
            paymentMethod: "cash",
            paymentDate: new Date().toISOString().split("T")[0],
            transactionId: "",
            notes: "",
          });
          setSelectedFeeHeads(new Set());
          setPaymentAllocation({});

          // Refresh fee breakdown
          await handleSearchStudent();
        } else {
          setError(
            result.error || 
            "Failed to process payment. Please try again."
          );
        }
      } catch (err: any) {
        console.error("[Payment] Error:", err);
        setError(
          getErrorMessage(err) || 
          "An error occurred while processing payment"
        );
      } finally {
        setRecordingPayment(false);
      }
    } else {
      setError("Please select at least one fee head to pay");
    }
  };`;

// Replace lines 1166-2533 (0-indexed: 1165-2532)
const startLine = 1165; // 0-indexed for line 1166
const endLine = 2532;   // 0-indexed for line 2533

const newLines = [
  ...lines.slice(0, startLine),
  newFunction,
  ...lines.slice(endLine + 1)
];

// Write back
fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');

console.log(`✅ Replaced lines 1166-2533 (${endLine - startLine + 1} old lines) with ${newFunction.split('\n').length} new lines`);
console.log(`Old file: ${lines.length} lines`);
console.log(`New file: ${newLines.length} lines`);
console.log(`Lines saved: ${lines.length - newLines.length}`);

