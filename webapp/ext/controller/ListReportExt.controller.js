sap.ui.define([
	'sap/ui/export/Spreadsheet',
	'/sap/ui/model/json/JSONModel',
	'sap/ui/export/library',
	'/sap/ui/model/Filter',
	'sap/ui/core/BusyIndicator'
], function (Spreadsheet, JSONModel, exportLibrary, Filter, BusyIndicator) {
	"use strict";
	var EdmType = exportLibrary.EdmType;
	return {
		onInit: function () {
			this.oTable = this.byId("listReport");
			this.oFilter = this.byId("listReportFilter");
			this.oTable.setUseExportToExcel(false);
			this.byId("exportButton").setIcon("sap-icon://excel-attachment");
			this.oFilter2 = this.getView().byId("listReportFilter").getFilters();

		},

		onAfterRendering: function () {
			this.oFilter.search();
		},

		onInitSmartFilterBarExtension: function () {
			//this.oFilter.getControlByKey("Rldnr").setValue("0L");
		},

		onExport: function (oEvent) {
			BusyIndicator.show();
			var oModel = this.getView().getModel()
			var oTable = this.getView().byId("analyticalTable");

			var that = this;

			try {
				this._read().then(function (data) {

					const aColumns = that._getClm();
					let aData = data;
					const resultArray = [];
					let topLevelHslSum = 0.0;
					let currency;
					let lostChild = false;

					const resultDictionary = {};

					aData.forEach(item => {
						const {
							Rbukrs,
							Racct,
							Mwskz,
							Hsl,
							Rhcur
						} = item;

						const superRbukrs = `${Rbukrs}`;
						const superRacct = `${superRbukrs}_${Racct}`;
						const superMwskz = `${superRacct}_${Mwskz}`;

						if (!currency) {
							currency = Rhcur;
						}

						if (!resultDictionary[superRbukrs]) {
							resultDictionary[superRbukrs] = {
								Rbukrs: Rbukrs,
								Rhcur: currency,
								Hsl: 0.0,
								level: 1
							};
							resultArray.push(resultDictionary[superRbukrs]);
						}

						if (!resultDictionary[superRacct]) {
							resultDictionary[superRacct] = {
								Rbukrs: Rbukrs,
								Racct: Racct,
								Rhcur: currency,
								Hsl: 0.0,
								level: 2
							};
							resultArray.push(resultDictionary[superRacct]);
						}

						if (!resultDictionary[superMwskz]) {
							resultDictionary[superMwskz] = {
								Rbukrs: Rbukrs,
								Racct: Racct,
								Mwskz: Mwskz,
								Rhcur: currency,
								Hsl: 0.0,
								level: 3
							};
							resultArray.push(resultDictionary[superMwskz]);
						} else {
							lostChild = true
						}

						const parsedHsl = parseFloat(Hsl);
						topLevelHslSum += parsedHsl;
						resultDictionary[superRbukrs].Hsl += parsedHsl;
						//resultDictionary[superRbukrs].Hsl = Number(resultDictionary[superRbukrs].Hsl.toFixed(2))
						resultDictionary[superRacct].Hsl += parsedHsl;
						//resultDictionary[superRacct].Hsl = Number(resultDictionary[superRacct].Hsl.toFixed(2))
						resultDictionary[superMwskz].Hsl += parsedHsl;
						//resultDictionary[superMwskz].Hsl = Number(resultDictionary[superMwskz].Hsl.toFixed(2))

						item.level = resultDictionary[superMwskz].level + 1;
						if (!lostChild) {
							resultArray.push(item);
						} else {
							let index = resultArray.findIndex((item) => item.Racct === Racct && item.Rbukrs === Rbukrs && item.Mwskz === Mwskz);
							resultArray.splice(index + 1, 0, item);
						}

					});

					//var currentLangu = that._getLanguage();

					/*if (currentLangu === "de-DE") {
						resultArray.forEach(function (item) {
							item.Hsl = item.Hsl.toString().replace('.', ',');
						});
					}*/

					resultArray.unshift({
						Rbukrs: "All",
						Rhcur: currency,
						Hsl: topLevelHslSum,
						level: 0
					});

					console.log(resultArray);

					var mSettings = {
						workbook: {
							columns: aColumns,
							hierarchyLevel: "level"
						},

						dataSource: resultArray,
						fileName: "Export.xlsx"
					};

					var oSpreadsheet = new Spreadsheet(mSettings);
					oSpreadsheet.build();
				})
			} catch (error) {

			}
		},

		_getDecimal: function (number) {
			var currentLangu = this._getLanguage();
			let regex = /\./g;
			if (currentLangu === "de-DE") {
				return number = number.toString().replace(regex, ",")
			} else {
				return number
			}
		},

		_getLanguage: function () {
			return sap.ui.getCore().getConfiguration().getLanguage();
		},

		_getClm: function () {

			var aColumns = [];

			aColumns.push({
				label: this.getResourceBundle().getText("Rbukrs"),
				property: "Rbukrs"
			});
			aColumns.push({
				label: "Year",
				property: "Gjahr",
				width: '4'
			});
			aColumns.push({
				label: "DocumentNo",
				property: "Belnr"
			});
			aColumns.push({
				label: "Steuerkennzeichen",
				property: "Mwskz",
				type: EdmType.String,
				width: 3
			});
			aColumns.push({
				label: this.getResourceBundle().getText("Lifnr"),
				property: "Lifnr",
				type: EdmType.String,
				width: 3
			});
			aColumns.push({
				label: "Ref Proc.",
				property: "Awtyp"
			});
			aColumns.push({
				label: "Belegart",
				property: "Blart",
				width: '2'
			});
			aColumns.push({
				label: "Buchungsschluessel",
				property: "Bschl",
				width: '2'
			});
			aColumns.push({
				label: "Buchungszeile",
				property: "Docln"
			});
			aColumns.push({
				label: "CO-Subkey",
				property: "Hrkft"
			});
			aColumns.push({
				label: "Kontoart",
				property: "Koart",
				width: '1'
			});
			aColumns.push({
				label: "Positionstyp",
				property: "Linetype"
			});
			aColumns.push({
				label: "Proficenter",
				property: "Prctr"
			});

			aColumns.push({
				label: "Satzart",
				property: "Rrcty",
				width: '1'
			});
			aColumns.push({
				label: "Segment",
				property: "Segment"
			});

			aColumns.push({
				label: "Psting Date",
				property: "Budat"
			});
			aColumns.push({
				label: "Doc. Date",
				property: "Bldat"
			});
			aColumns.push({
				label: "Amount",
				property: "Hsl",
				type: EdmType.Currency,
				unitProperty: "Rhcur",
				width: '18'
			});
			/*aColumns.push({
				label: "Currency",
				property: "Rhcur"
			});*/
			aColumns.push({
				label: "Account Nr.",
				property: "Racct"
			});
			aColumns.push({
				label: "Ledger",
				property: "Rldnr",
				type: EdmType.String,
				width: "2"
			});

			/*
			aColumns.push({
				label: "CoCd",
				property: "Bukrs"
			});
			aColumns.push({
				label: "LnItm",
				property: ""
			});
			aColumns.push({
				label: "GLFY",
				property: ""
			});

			aColumns.push({
				label: "ref Doc",
				property: ""
			});
			aColumns.push({
				label: "DocType",
				property: ""
			});
			aColumns.push({
				label: "S",
				property: ""
			});
			aColumns.push({
				label: "Trs",
				property: ""
			});
			aColumns.push({
				label: "Prurch. Doc",
				property: ""
			});
			aColumns.push({
				label: "Item",
				property: ""
			});
			aColumns.push({
				label: "Order",
				property: ""
			});
			aColumns.push({
				label: "Cat",
				property: ""
			});
			aColumns.push({
				label: "clring Doc.",
				property: ""
			});
			aColumns.push({
				label: "year",
				property: ""
			});
			aColumns.push({
				label: "doc No",
				property: ""
			});*/

			return aColumns;
		},

		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		_read: function () {
			var that = this;
			var oModel = this.getView().getModel();
			var aFilters = []
			var aFilter = this.getView().byId("listReportFilter").getFilters()[0]
			if (aFilter) {
				aFilters = aFilter.getFilters();
			}

			/*return new Promise(function (resolve, reject) {

				oModel.read("/ZZ_C_BSIK_ACDOCA", {
					filters: aFilter.getFilters(),
					urlParameters: {
						"$top": 10000,
						"$skip": 0
					},
					success: function (oRetrievedResult) {
						resolve(oRetrievedResult)
							// do something 
					},
					error: function (oError) {  
					//do something 
					}
				});
			})*/

			return new Promise(function (resolve, reject) {

				var mParameters = {
					groupId: "batchRead"
				};
				var aDeferredGroup = oModel.getDeferredGroups().concat(["batchRead"]);
				oModel.setDeferredGroups(aDeferredGroup);

				oModel.read("/ZZ_C_BSIK_ACDOCA", {
					filters: aFilters,
					groupId: mParameters.groupId,
					urlParameters: {
						"$top": 5000,
						"$skip": 0
					}
				});

				oModel.read("/ZZ_C_BSIK_ACDOCA", {
					filters: aFilters,
					groupId: mParameters.groupId,
					urlParameters: {
						"$top": 5000,
						"$skip": 5000
					}
				});
				oModel.read("/ZZ_C_BSIK_ACDOCA", {
					filters: aFilters,
					groupId: mParameters.groupId,
					urlParameters: {
						"$top": 5000,
						"$skip": 10000
					}
				});

				oModel.read("/ZZ_C_BSIK_ACDOCA", {
					filters: aFilters,
					groupId: mParameters.groupId,
					urlParameters: {
						"$top": 5000,
						"$skip": 15000
					}
				});
				oModel.read("/ZZ_C_BSIK_ACDOCA", {
					filters: aFilters,
					groupId: mParameters.groupId,
					urlParameters: {
						"$top": 5000,
						"$skip": 20000
					}
				});

				oModel.read("/ZZ_C_BSIK_ACDOCA", {
					filters: aFilters,
					groupId: mParameters.groupId,
					urlParameters: {
						"$top": 5000,
						"$skip": 25000
					}
				});
				oModel.read("/ZZ_C_BSIK_ACDOCA", {
					filters: aFilters,
					groupId: mParameters.groupId,
					urlParameters: {
						"$top": 5000,
						"$skip": 30000
					}
				});

				oModel.read("/ZZ_C_BSIK_ACDOCA", {
					filters: aFilters,
					groupId: mParameters.groupId,
					urlParameters: {
						"$top": 5000,
						"$skip": 35000
					}
				});
				oModel.read("/ZZ_C_BSIK_ACDOCA", {
					filters: aFilters,
					groupId: mParameters.groupId,
					urlParameters: {
						"$top": 5000,
						"$skip": 40000
					}
				});

				oModel.read("/ZZ_C_BSIK_ACDOCA", {
					filters: aFilters,
					groupId: mParameters.groupId,
					urlParameters: {
						"$top": 5000,
						"$skip": 45000
					}
				});
				oModel.read("/ZZ_C_BSIK_ACDOCA", {
					filters: aFilters,
					groupId: mParameters.groupId,
					urlParameters: {
						"$top": 5000,
						"$skip": 50000
					}
				});

				oModel.submitChanges({
					groupId: mParameters.groupId,
					success: function (oRetrievedResult) {
						var mergedResults = [];

						for (var i = 0; i < 11; i++) {
							var results = (oRetrievedResult.__batchResponses[i] &&
								oRetrievedResult.__batchResponses[i].data.results) || [];
							mergedResults = mergedResults.concat(results);
						}
						BusyIndicator.hide();
						resolve(mergedResults)

					},
					error: function (oError) {
						BusyIndicator.hide();
					}

				});

			})

		}

	};
});