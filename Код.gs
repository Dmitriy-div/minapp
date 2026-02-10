const SHEET_ID = "1Yf6N7-Tg7Br7m0PFy7b5B3q-UD7n0cUfbAedVyEx5VI";

function doGet(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const action = e.parameter.action;

  try {
    // 1. Список покупок
    if (action === 'getShopping') {
      const sheet = ss.getSheetByName("shopping");
      const rows = sheet.getDataRange().getValues();
      return jsonResponse(rows.slice(1).map((r, index) => ({ id: index + 2, name: r[0], status: r[1] })));
    }

    // 2. Копилка (Цели)
    if (action === 'getSavings') {
      const sheet = ss.getSheetByName("savings");
      const rows = sheet.getDataRange().getValues();
      return jsonResponse(rows.slice(1).map(r => ({ id: r[0], name: r[1], current: parseFloat(r[2]) || 0, target: parseFloat(r[3]) || 0 })));
    }

    // 3. Рассрочки (Список)
    if (action === 'getLoans') {
      const sheet = ss.getSheetByName("loans");
      const rows = sheet.getDataRange().getValues();
      return jsonResponse(rows.slice(1).map(r => ({ id: r[0], name: r[1], balance: parseFloat(r[2]) || 0, total: parseFloat(r[3]) || 0 })));
    }

    // 4. График платежей конкретной рассрочки
    if (action === 'getInstallmentPlan') {
      const sheet = ss.getSheetByName("installments");
      const rows = sheet.getDataRange().getValues();
      const plan = rows.slice(1).filter(r => r[0].toString() === e.parameter.loanId.toString())
        .map(r => ({ 
          date: Utilities.formatDate(new Date(r[1]), Session.getScriptTimeZone(), "dd.MM.yyyy"), 
          amount: parseFloat(r[2]) || 0, 
          status: r[3] 
        }));
      return jsonResponse(plan);
    }

    // 5. Бюджет (Главная)
    const sheet = ss.getSheetByName("operations");
    const rows = sheet.getDataRange().getValues();
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    let totalIncome = 0, totalExpense = 0;
    const categorySums = {}, operations = [];

    for (let i = 1; i < rows.length; i++) {
      const d = new Date(rows[i][0]);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const type = rows[i][1], amt = parseFloat(rows[i][2]) || 0;
        operations.push({ 
          date: Utilities.formatDate(d, Session.getScriptTimeZone(), "dd.MM.yyyy"), 
          type, amount: amt, category: rows[i][3], comment: rows[i][4] 
        });
        if (type === "income") totalIncome += amt;
        else { 
          totalExpense += amt; 
          categorySums[rows[i][3]] = (categorySums[rows[i][3]] || 0) + amt; 
        }
      }
    }
    return jsonResponse({ totalIncome, totalExpense, categorySums, operations });
  } catch (err) { return jsonResponse({ error: err.toString() }); }
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  try {
    if (data.action === 'addShopping') {
      ss.getSheetByName("shopping").appendRow([data.name, "pending", data.user_id]);
    } else if (data.action === 'toggleShopping') {
      ss.getSheetByName("shopping").getRange(data.id, 2).setValue(data.status);
    } else if (data.action === 'markPaid') {
      const instSheet = ss.getSheetByName("installments");
      const rows = instSheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        let rowDate = Utilities.formatDate(new Date(rows[i][1]), Session.getScriptTimeZone(), "dd.MM.yyyy");
        if (rows[i][0].toString() === data.loanId.toString() && rowDate === data.date) {
          instSheet.getRange(i + 1, 4).setValue("paid");
          const loansSheet = ss.getSheetByName("loans");
          const lData = loansSheet.getDataRange().getValues();
          for (let j = 1; j < lData.length; j++) {
            if (lData[j][0].toString() === data.loanId.toString()) {
              loansSheet.getRange(j + 1, 3).setValue(parseFloat(lData[j][2]) - parseFloat(rows[i][2]));
              break;
            }
          }
          break;
        }
      }
    } else if (data.type === 'savings') {
      const sheet = ss.getSheetByName("savings");
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === data.category) {
          sheet.getRange(i + 1, 3).setValue((parseFloat(rows[i][2]) || 0) + parseFloat(data.amount));
          break;
        }
      }
      ss.getSheetByName("operations").appendRow([new Date(), "expense", data.amount, "Копилка: " + data.category, data.comment, data.user_id]);
    } else {
      ss.getSheetByName("operations").appendRow([new Date(), data.type, data.amount, data.category, data.comment, data.user_id]);
    }
    return ContentService.createTextOutput("OK");
  } catch(e) { return ContentService.createTextOutput("Error: " + e.toString()); }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
