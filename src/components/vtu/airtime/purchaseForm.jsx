// Update handleSubmit to pass userId
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!isAuthenticated) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to continue.",
      variant: "destructive",
    });
    return;
  }

  const transactionAmount = getTransactionAmount();

  if (!transactionAmount || transactionAmount <= 0) {
    toast({
      title: "Invalid Amount",
      description: "Please enter a valid amount or select a plan.",
      variant: "destructive",
    });
    return;
  }

  if (walletBalance < transactionAmount) {
    setShowInsufficientModal(true);
    return;
  }

  setIsSubmitting(true);

  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const token = await currentUser.getIdToken();

    const transactionData = {
      userId: currentUser.uid,
      serviceType: type.toLowerCase(),
      amount: transactionAmount,
      phone: phone || undefined,
      network: network || undefined,
      variationId: dataPlan || undefined,
      customerId: cardNumber || undefined,
    };

    const response = await fetch("/api/vtu/transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    });

    const result = await response.json();

    if (response.status === 402) {
      toast({
        title: "Insufficient Balance",
        description: "Your wallet balance is not enough for this transaction.",
        variant: "destructive",
      });
      return;
    }

    if (!response.ok) {
      throw new Error(result.error || "Transaction failed");
    }

    toast({
      title: "Transaction Successful",
      description: `${type} purchase completed successfully.`,
    });

    // Reset form
    setNetwork("");
    setPhone("");
    setAmount("");
    setDataPlan("");
    setProvider("");
    setCardNumber("");

    // Refresh wallet balance
    fetchWalletBalance();
  } catch (error) {
    console.error("Transaction error:", error);
    toast({
      title: "Transaction Failed",
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};
