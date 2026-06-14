/**
 * Utility function to generate VietQR image URL
 * Based on the Python implementation from the vietqr integration branch.
 */

export interface VietQRParams {
  bankId: string;
  accountNo: string;
  template: string; // e.g., 'compact', 'qr_only', 'print'
  amount: number;
  description: string;
  accountName: string;
}

export const generateVietQRUrl = (params: VietQRParams): string => {
  const { bankId, accountNo, template, amount, description, accountName } = params;
  
  const baseUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png`;
  
  const queryParams = new URLSearchParams({
    amount: amount.toString(),
    addInfo: description,
    accountName: accountName
  });
  
  return `${baseUrl}?${queryParams.toString()}`;
};
