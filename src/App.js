  Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'iteration',
    comboboxConfig: {
        fieldLabel: 'Select an Iteration:',
        labelWidth: 100,
        width: 300
    },
  
    onScopeChange: function() {
       if (this.down('#testSetComboxBox')) {
	    this.down('#testSetComboxBox').destroy();   
	}
	 if (this.down('#myChart')) {
	    this.down('#myChart').destroy();
	 }
	var testSetComboxBox = Ext.create('Rally.ui.combobox.ComboBox',{
	    id: 'testSetComboxBox',
	    storeConfig: {
		model: 'TestSet',
		limit: Infinity,
		pageSize: 100,
		autoLoad: true,
		filters: [this.getContext().getTimeboxScope().getQueryFilter()]
	    },
	    fieldLabel: 'select TestSet',
	    listeners:{
                ready: function(combobox){
		    if (combobox.getRecord()) {
			this._onTestSetSelected(combobox.getRecord());
		    }
		    else{
			console.log('selected iteration has no testsets');
			if (this.down('#grid')) {
			    this.down('#grid').destroy();
			}
		    }
		},
                select: function(combobox){
		    if (combobox.getRecord()) {
		      if (this.down('#myChart')) {
			  this.down('#myChart').destroy();
			  this._onTestSetSelected(combobox.getRecord());
		      }
			
		    }	        
                },
                scope: this
            }
	});
	this.add(testSetComboxBox);  
    },
    
     _onTestSetSelected:function(testset){
      this._myMask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait.This may take long if you have thousands of results..."});
      this._myMask.show();
	this._myStore = Ext.create('Rally.data.WsapiDataStore', {
           model: 'Test Case Result',
	   limit: Infinity,
           fetch: ['Verdict','TestCase','Build'],
	   filters:[
	    {
	      property: 'TestSet',
	      value: testset.get('_ref')
	    }
	   ],
           autoLoad: true,
           listeners: {
              load: this._onDataLoaded,
              scope: this
            }
       });
     },
       

     _onDataLoaded: function(store, data) {
          this._myMask.hide();
	  var records = [];
	  var verdictsGroups = ["Pass","Blocked","Error","Fail","Inconclusive"]

	  var passCount = 0;
	  var blockedCount = 0;
	  var errorCount = 0;
	  var failCount = 0;
	  var inconclusiveCount = 0;
	  
	  var getColor = {
	      'Pass': '#009900',
	      'Blocked': '#FF8000',
	      'Error': '#990000', 
	      'Fail': '#FF0000', 
	      'Inconclusive': '#A0A0A0'
	  };

	  Ext.Array.each(data, function(record) {
	      verdict = record.get('Verdict');
	      switch(verdict)
	      {
		  case "Pass":
		     passCount++;
		      break;
		  case "Blocked":
		      blockedCount++;
		      break;
		  case "Error":
		      errorCount++;
		      break;
		  case "Fail":
		      failCount++;
		      break;
		  case "Inconclusive":
		      inconclusiveCount++;
	      }
	  });
	  if (this.down('#myChart')) {
		      this.remove('myChart');
	  }
	  if (this.down('#myChart2')) {
		      this.remove('myChart2');
	  }
	  this.add(
	      {
			xtype: 'rallychart',
			height: 400,
			storeType: 'Rally.data.WsapiDataStore',
			store: this._myStore,
			itemId: 'myChart',
			chartConfig: {
			    chart: {
				type: 'pie'
			    },
			    title: {
				text: 'TestCaseResults Verdict Counts',
				align: 'center'
			    },
			    tooltip: {
				formatter: function () {
				   return this.point.name + ': <b>' + Highcharts.numberFormat(this.percentage, 1) + '%</b><br />' + this.point.y;
				    }
			    },
			    plotOptions : {
				 pie: {
				    allowPointSelect: true,
				    cursor: 'pointer',
				    point: {
					events: {
					    click: function(event) {
						var options = this.options;
						alert(options.name + ' clicked');
					    }
					}
				    },
				    dataLabels: {
					enabled: true,
					color: '#000000',
					connectorColor: '#000000'
				    }
				}
			    }
			},            
			chartData: {
			    series: [ 
				{   
				    name: 'Verdicts',
				    data: [
					{name: 'Pass',
					y: passCount,
					color: getColor['Pass']
					},
					{name: 'Blocked',
					y: blockedCount,
					color: getColor['Blocked']
					},
					{name: 'Fail',
					y: failCount,
					color: getColor['Fail']
					},
					{name: 'Error',
					 y: errorCount,
					color: getColor['Error']
					},
					{name: 'Inconclusive',
					 y: inconclusiveCount,
					color: getColor['Inconclusive']
					}
					  ]
				}
			    ]
			}
	    }
	);
	this.down('#myChart')._unmask();
    }
     
 });
