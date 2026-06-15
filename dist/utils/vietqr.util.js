"use strict";
/**
 * Utility function to generate VietQR image URL
 * Based on the Python implementation from the vietqr integration branch.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVietQRUrl = void 0;
const generateVietQRUrl = (params) => {
    const { bankId, accountNo, template, amount, description, accountName } = params;
    const baseUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png`;
    const queryParams = new URLSearchParams({
        amount: amount.toString(),
        addInfo: description,
        accountName: accountName
    });
    return `${baseUrl}?${queryParams.toString()}`;
};
exports.generateVietQRUrl = generateVietQRUrl;
