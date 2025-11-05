// services/pdfService.ts
import { LoanApplication } from '../models/LoanApplication';

export class PdfService {
    static generateLoanListPdf(loans: LoanApplication[]): string {
        if (loans.length === 0) {
            return this.generateEmptyPdf();
        }

        const pdfContent = this.generatePdfContent(loans);

        // For web - create a Blob and URL
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
    }

    private static generateEmptyPdf(): string {
        const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Loan Applications Report</title>
        <style>
          ${this.getPdfStyles()}
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Loan Applications Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="empty-state">
          <h2>No Applications Available</h2>
          <p>There are no loan applications to display.</p>
        </div>
      </body>
      </html>
    `;

        const blob = new Blob([content], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
    }

    private static generatePdfContent(loans: LoanApplication[]): string {
        const totalApplications = loans.length;
        const withPdfCount = loans.filter(loan => loan.paysheetUri).length;
        const highIncomeCount = loans.filter(loan => loan.salary >= 50000).length;
        const totalSalary = loans.reduce((sum, loan) => sum + loan.salary, 0);
        const averageSalary = totalSalary / totalApplications;

        const loanRows = loans.map(loan => `
      <tr>
        <td>${loan.id || 'N/A'}</td>
        <td>${this.escapeHtml(loan.name)}</td>
        <td>${this.escapeHtml(loan.email)}</td>
        <td>${this.escapeHtml(loan.tel)}</td>
        <td>${this.escapeHtml(loan.occupation)}</td>
        <td>LKR ${loan.salary.toLocaleString()}</td>
        <td>${loan.paysheetUri ? 'Yes' : 'No'}</td>
        <td>${loan.submittedAt ? new Date(loan.submittedAt).toLocaleDateString() : 'N/A'}</td>
      </tr>
    `).join('');

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Loan Applications Report</title>
        <style>
          ${this.getPdfStyles()}
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Loan Applications Report</h1>
          <div class="report-info">
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Total Applications:</strong> ${totalApplications}</p>
          </div>
        </div>

        <div class="stats-container">
          <div class="stat-card">
            <h3>Total Applications</h3>
            <div class="stat-number">${totalApplications}</div>
          </div>
          <div class="stat-card">
            <h3>With PDF</h3>
            <div class="stat-number">${withPdfCount}</div>
          </div>
          <div class="stat-card">
            <h3>High Income</h3>
            <div class="stat-number">${highIncomeCount}</div>
          </div>
          <div class="stat-card">
            <h3>Avg Salary</h3>
            <div class="stat-number">LKR ${averageSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Occupation</th>
                <th>Salary</th>
                <th>PDF</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              ${loanRows}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Confidential - Loan Applications Report</p>
        </div>
      </body>
      </html>
    `;
    }

    private static getPdfStyles(): string {
        return `
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 20px;
        color: #333;
        background-color: #fff;
      }
      
      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #667eea;
        padding-bottom: 20px;
      }
      
      .header h1 {
        color: #667eea;
        margin: 0 0 10px 0;
        font-size: 28px;
      }
      
      .report-info {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin-top: 10px;
      }
      
      .stats-container {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-bottom: 30px;
        flex-wrap: wrap;
      }
      
      .stat-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
        min-width: 120px;
      }
      
      .stat-card h3 {
        margin: 0 0 8px 0;
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .stat-number {
        font-size: 20px;
        font-weight: bold;
        color: #667eea;
      }
      
      .table-container {
        margin: 30px 0;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      
      th {
        background-color: #667eea;
        color: white;
        padding: 12px 8px;
        text-align: left;
        font-weight: 600;
        border: 1px solid #5a67d8;
      }
      
      td {
        padding: 10px 8px;
        border: 1px solid #e2e8f0;
      }
      
      tr:nth-child(even) {
        background-color: #f8fafc;
      }
      
      tr:hover {
        background-color: #f1f5f9;
      }
      
      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #6b7280;
      }
      
      .empty-state h2 {
        margin-bottom: 10px;
        color: #9ca3af;
      }
      
      .footer {
        margin-top: 40px;
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        color: #6b7280;
        font-size: 12px;
      }
      
      @media print {
        body {
          padding: 10px;
        }
        
        .stat-card {
          break-inside: avoid;
        }
      }
    `;
    }

    private static escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}