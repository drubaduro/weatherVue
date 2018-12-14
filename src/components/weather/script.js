import LineChart from '../LineChart.js'
import axios from 'axios'

var LS = {
    set: function(name, data){
        localStorage.setItem(name, JSON.stringify(data))
    },
    get: function(name){
        return JSON.parse(localStorage.getItem(name));
    }
};

var drawValues = function (index, fixAt, measure) { //  index to skip, toFixed signs, measure
    var chartInstance = this.chart,
    ctx = chartInstance.ctx;
    ctx.font = Chart.helpers.fontString(12, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
    ctx.fillStyle = Chart.defaults.global.defaultFontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    this.data.datasets.forEach(function (dataset, i) {
        if(i == index) return;
        var meta = chartInstance.controller.getDatasetMeta(i);
        meta.data.forEach(function (bar, index) {
            var data = dataset.data[index].toFixed(fixAt) + measure;
            ctx.fillText(data, bar._model.x, bar._model.y - 4);
        });
    });
}



export default {
    name: 'Weather',
    components: {
        LineChart
    },
    data: function() {
        return {
            colorScheme: {
                day: {
                    class: 'dayTheme',
                    defaultFontColor: '#333333',
                    gridColor: 'rgba(50, 50, 50, 0.2)',
                    chart_1_borderColor_1: 'rgba(200, 100, 100, 0.5)',
                    chart_1_backgroundColor_1: 'rgba(200, 100, 100, 0.5)',
                    chart_1_borderColor_2: 'rgba(50, 50, 128, 0.5)',
                    chart_1_backgroundColor_2: 'rgba(50, 50, 128, 0.5)',
                    chart_2_borderColor_1: 'rgba(50, 50, 128, 0.5)',
                    chart_2_backgroundColor_1: 'rgba(50, 50, 128, 0.5)',
                    chart_2_borderColor_2: 'rgba(200, 100, 100, 0.5)',
                    chart_2_backgroundColor_2: 'rgba(200, 100, 100, 0.5)',
                    chart_3_borderColor: 'rgba(0, 127, 0, 0.7)',
                    chart_3_backgroundColor: 'rgba(0, 100, 0, 0.5)'
                },
                night: {
                    class: 'nightTheme',
                    defaultFontColor: '#cccccc',
                    gridColor: 'rgba(200, 200, 200, 0.2)',
                    chart_1_borderColor_1: 'rgba(200, 200, 200, 0.5)',
                    chart_1_backgroundColor_1: 'rgba(200, 200, 200, 0.5)',
                    chart_1_borderColor_2: 'rgba(200, 200, 200, 0.5)',
                    chart_1_backgroundColor_2: 'rgba(200, 200, 200, 0.5)',
                    chart_2_borderColor_1: 'rgba(200, 200, 200, 0.5)',
                    chart_2_backgroundColor_1: 'rgba(200, 200, 200, 0.5)',
                    chart_2_borderColor_2: 'rgba(200, 200, 200, 0.5)',
                    chart_2_backgroundColor_2: 'rgba(200, 200, 200, 0.5)',
                    chart_3_borderColor: 'rgba(200, 200, 200, 0.5)',
                    chart_3_backgroundColor: 'rgba(200, 200, 200, 0.5)'
                }
            },
            url: 'http://api.openweathermap.org/data/2.5/',
            apiKey: 'fadef89949c2e03273c90c8bac1f8cfb',
            cityId: '524901', // Moscow
            refreshWeatherDelay: 10, // minutes
            refreshForecastDelay: 60, // minutes
            pressureHistoryInterval: 180, // minutes
            pressureHistoryUpdateEvery: 3, // Hours
            precipMaxPossibleValue: 7, //
            chart1: null, // Precipitations
            chart2: null, // Forecast
            chart3: null, // Pressure
            opt1: null,
            opt2: null,
            opt3: null,
            inID1: null,
            inID2: null,
            weather: {},
            forecast: [],
            forecastLoaded: false,
            visualClass: '',
            windDirection: '',
            pressureHistory: [{time: 0, mmhg: 0}],
            nextPrecipitation: 0,
            currentTheme: '',
            sunriseDateTime: 0,
            sunsetDateTime: 0,
            now: Date.now(),
            dayOrNight: '',
            gridColor: 'rgba(128, 128, 128, 0.5)',
            sunrise: {},
            sunset: {},
            weatherUpdatedAt: {},
            isUpdated: false,
            currentTime: {
                hour: '00',
                minute: '00',
                second: '00'
            }
        }
    },
    mounted: function(){
        var ph = LS.get('pressureHistory');
		if(!ph) {
			LS.set('pressureHistory', this.pressureHistory);
		} else {
			this.pressureHistory = ph;
		};
        setInterval(this.refreshTime, 1000);
        this.setIntervals();
    },
    methods: {
        aaa: function(){
            console.log(this.opt3.scales.yAxes[0].gridLines.color);
            this.opt3.scales.yAxes[0].gridLines.color = '#ff0000';
        },

        setIntervals: function(){
            if(this.inID1 && this.inID2){
                clearInterval(this.inID1);
                clearInterval(this.inID2);
            };
            this.inID1 = setInterval(this.refreshWeather, this.refreshWeatherDelay * 60000);
            this.inID1 = setInterval(this.refreshForecast, this.refreshForecastDelay * 60000);
            this.refreshWeather();
            this.refreshForecast();
        },
        
        getFotmattedDateTime: function(dateTime){
            var month = dateTime.getMonth();
            month++;
            var fdt = {};
            fdt.month = month.addLeadZero(2);
            fdt.day = dateTime.getDate().addLeadZero(2);
            fdt.hour = dateTime.getHours().addLeadZero(2);
            fdt.minute = dateTime.getMinutes().addLeadZero(2);
            fdt.second = dateTime.getSeconds().addLeadZero(2);
            return fdt;
        },
        degToCompass: function(num) {
            var val = Math.floor((num / 22.5) + 0.5);
            //var arr = ["С", "ССВ", "СВ", "ВСВ", "В", "ВЮВ", "ЮВ", "ЮЮВ", "Ю", "ЮЮЗ", "ЮЗ", "ЗЮЗ", "З", "ЗСЗ", "СЗ", "ССЗ"];
            var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
            return arr[(val % 16)];
        },
        refreshTime: function(){
			this.currentTime = this.getFotmattedDateTime(new Date());
			if(this.isUpdated) {
				this.now = Date.now();
				var lastValue = this.dayOrNight;
				this.dayOrNight = (this.now > this.sunriseDateTime && this.now < this.sunsetDateTime ? 'day' : 'night');
				if(this.dayOrNight != lastValue) {
					this.currentTheme = this.colorScheme[this.dayOrNight].class;
					this.updateChartsColor();
				};
            }
        },
        refreshData: function(type){
            var self = this;
            this.isUpdated = false;
            return axios.get(self.url + type, {
                params: {
                    id: self.cityId,
                    units: 'metric',
                    appid: self.apiKey
                }
            }).catch(function(error){
                alert(error);
            });
        },
        refreshWeather: function(){
			var self = this;
			this.refreshData('weather').then(function(response){
                self.isUpdated = true;
                var data = response.data;
				console.log('weather loaded', data);
                self.weather = data;
				
				self.sunriseDateTime = data.sys.sunrise * 1000; //sec * 1000
				self.sunsetDateTime = data.sys.sunset * 1000; //sec * 1000
				self.sunrise = self.getFotmattedDateTime(new Date(self.sunriseDateTime));
				self.sunset = self.getFotmattedDateTime(new Date(self.sunsetDateTime));
				self.visualClass = data.weather[0].icon;
				self.windDirection = self.degToCompass(data.wind.deg);
                self.weatherUpdatedAt = self.getFotmattedDateTime(new Date(self.now)); // msec
                
                var ph = LS.get('pressureHistory');
				var phLast = ph.slice(-1);
				if(self.now - phLast[0].time > self.pressureHistoryInterval * 60000) {
					ph.push({
						time: self.now,
						mmhg: Math.round(data.main.pressure * 0.750062)
					});
					self.pressureHistory = ph.slice(-8);
					LS.set('pressureHistory', self.pressureHistory);
				};
				
				var labels = self.pressureHistory.map(function(el){
					var a = new self.getFotmattedDateTime(new Date(el.time));
					return a.hour + ':' + a.minute
				});
				var data = self.pressureHistory.map(function(el){
					return el.mmhg;
                });

                self.opt3 = {
                    defaultFontFamily: "Roboto",
                    //responsive: false,
                    maintainAspectRatio: false,
                    //defaultFontColor = '#ff0000',
                    defaultFontSize: 9,
                    events: false,
                    tooltips: {
                        enabled: false
                    },
                    hover: {
                        animationDuration: 0
                    },
                    animation: {
                        duration: 1,
                        onComplete: function(){ drawValues.call(this, 9, 0, ' mm'); }
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                min: 730,
                                max: 790,
                                stepSize: 10,
                                autoSkip: false,
                                display: false
                            },
                            gridLines: {
                                color: self.gridColor
                            }
                        }],
                        xAxes: [{
                            ticks: {
                                display: true
                            },
                            gridLines: {
                                color: self.gridColor,
                                zeroLineWidth: 0,
                                zeroLineColor: 'rgba(0, 0, 0, 0)'
                            },
                            categoryPercentage: 0.96,
                            barPercentage: 1
                        }]
                    },
                    legend: {
                        display: false
                    }
                };
                
                self.chart3 = {
                    labels: labels,
                    datasets: [{
                        data: data,
                        fill: false,
                        borderWidth: 0,
                        pointRadius: 0,
                        pointBorderWidth: 0,
                        label: 'mm Hg',
                        steppedLine: false,
                    }]
                };

                
                
				
                
            });
        },
        refreshForecast: function(){
            var self = this;
			this.refreshData('forecast').then(function(response){
                self.isUpdated = true;
                var data = response.data;
                console.log('forecast loaded', data);
                self.forecast = data;

                var prevDay = 0;

                var labels = data.list.map(function(el){
					var a = self.getFotmattedDateTime(new Date(el.dt * 1000));
					var b = (a.day != prevDay)? a.day + '.' + a.month + ', ' : '';
					prevDay = a.day;
					return b + a.hour + ':00';
				});
				var data0 = data.list.map(function(el){
					return el.main.temp
				});
				
				var data1 = data.list.map(function(el){
					if(el.snow) {
						return (el.snow['3h'])? el.snow['3h'] : 0
					};
					if(el.rain) {
						return (el.rain['3h'])? el.rain['3h'] : 0
					}
				});

                self.opt2 = {
                    defaultFontFamily: "Roboto",
                    //responsive: false,
                    maintainAspectRatio: false,
                    //defaultFontColor = '#ff0000',
                    defaultFontSize: 9,
                    scales: {
                        yAxes: [{
                            position: 'left',
                            id: 'yAxe0'
                        },
                        {
                            position: 'right',
                            id: 'yAxe1',
                            gridLines: {
                                display: false
                            },
                            ticks: {
                                display: false,
                                min: 0,
                                max: self.precipMaxPossibleValue
                            }
                        }],
                        xAxes: [{
                            ticks: {
                                display: true
                            }
                        }]
                    },
                    legend: {
                        display: false
                    }
                };

                self.chart2 = {
                    labels: labels,
                    datasets: [{
                        type: 'line',
                        data: data0,
                        fill: false,
                        borderWidth: 3,
                        pointRadius: 1,
                        pointBorderWidth: 1,
                        yAxisID: 'yAxe0',
                        label: 't, °C'
                    },
                    {
                        data: data1,
                        fill: false,
                        borderWidth: 0,
                        pointRadius: 0,
                        pointBorderWidth: 0,
                        yAxisID: 'yAxe1',
                        label: 'Precipitation',
                    }]
                };


                var nextNearest = data.list.slice(0, 7);
				
				var labels = nextNearest.map(function(el){
					var a = self.getFotmattedDateTime(new Date(el.dt * 1000));
					var b = (a.day != prevDay)? a.day + '.' + a.month + ', ' : '';
					prevDay = a.day;
					return b + a.hour + ':00';
				});
				var data0 = nextNearest.map(function(el){
					if(el.snow) {
						return (el.snow['3h'])? el.snow['3h'] : 0
					};
					if(el.rain) {
						return (el.rain['3h'])? el.rain['3h'] : 0
					}
				});
				var data1 = nextNearest.map(function(el){
					return el.main.temp;
                });
                
                self.nextPrecipitation = data0[0];

                self.chart1 = {
                    labels: labels,
                    datasets: [{
                        data: data0,
                        fill: false,
                        borderWidth: 0,
                        pointRadius: 0,
                        pointBorderWidth: 0,
                        yAxisID: 'yAxe0'
                    },
                    {
                        type: 'line',
                        data: data1,
                        fill: false,
                        borderWidth: 3,
                        pointRadius: 1,
                        pointBorderWidth: 1,
                        yAxisID: 'yAxe1'
                    }]
                };

                self.opt1 = {
                    defaultFontFamily: "Roboto",
                    //responsive: false,
                    maintainAspectRatio: false,
                    //defaultFontColor = '#ff0000',
                    defaultFontSize: 9,
                    events: false,
                    tooltips: {
                        enabled: false
                    },
                    hover: {
                        animationDuration: 0
                    },
                    animation: {
                        duration: 1,
                        onComplete: function(){ drawValues.call(this, 0, 1, '°C'); }
                    },
                    
                    scales: {
                        yAxes: [{
                            position: 'left',
                            id: 'yAxe0',
                            ticks: {
                                min: 0,
                                max: self.precipMaxPossibleValue
                            }
                        },
                        {
                            position: 'right',
                            id: 'yAxe1',
                            gridLines: {
                                display: false
                            },
                            ticks: {
                                display: false,
                                min: Math.min.apply(null, data1) - 1,
                                max: Math.max.apply(null, data1) + 1.5
                            }
                        }],
                        xAxes: [{
                            gridLines: {
                                zeroLineWidth: 0,
                                zeroLineColor: 'rgba(0, 0, 0, 0)'
                            }
                        }]
                    },
                    legend: {
                        display: false
                    }
                };

            })
        },
        updateChartsColor: function(){

			var dayOrNight = this.dayOrNight == '' ? 'day' : this.dayOrNight;
			Chart.defaults.global.defaultFontColor = this.colorScheme[this.dayOrNight].defaultFontColor;
			this.gridColor = this.colorScheme[this.dayOrNight].gridColor;
			if(typeof chart1 == 'object') {
				chart1.options.scales.yAxes[0].gridLines.color = self.gridColor();
				chart1.options.scales.yAxes[1].gridLines.color = self.gridColor();
				chart1.options.scales.xAxes[0].gridLines.color = self.gridColor();
				chart1.data.datasets[0].borderColor = colorScheme[dayOrNight].chart_1_borderColor_1;
				chart1.data.datasets[0].backgroundColor = colorScheme[dayOrNight].chart_1_backgroundColor_1;
				chart1.data.datasets[1].borderColor = colorScheme[dayOrNight].chart_1_borderColor_2;
				chart1.data.datasets[1].backgroundColor = colorScheme[dayOrNight].chart_1_backgroundColor_2;
				chart1.update();
			};
			if(typeof chart2 == 'object') {
				chart2.options.scales.yAxes[0].gridLines.color = self.gridColor();
				chart2.options.scales.yAxes[1].gridLines.color = self.gridColor();
				chart2.options.scales.xAxes[0].gridLines.color = self.gridColor();
				
				chart2.data.datasets[0].borderColor = colorScheme[dayOrNight].chart_2_borderColor_1;
				chart2.data.datasets[0].backgroundColor = colorScheme[dayOrNight].chart_2_backgroundColor_1;
				chart2.data.datasets[1].borderColor = colorScheme[dayOrNight].chart_2_borderColor_2;
				chart2.data.datasets[1].backgroundColor = colorScheme[dayOrNight].chart_2_backgroundColor_2;
				chart2.update();
			};
			if(typeof chart3 == 'object') {
				chart3.options.scales.yAxes[0].gridLines.color = self.gridColor();
				chart3.options.scales.xAxes[0].gridLines.color = self.gridColor();
				chart3.data.datasets[0].borderColor = colorScheme[dayOrNight].chart_3_borderColor;
				chart3.data.datasets[0].backgroundColor = colorScheme[dayOrNight].chart_3_backgroundColor;
				chart3.update();
			};
        },
        updateAll: function(){
            this.setIntervals();
        },
        goFullScreen: function(){
            var element = document.documentElement;
            if (!document.mozFullScreen && !document.webkitFullScreen) {
				if (element.mozRequestFullScreen) {
					element.mozRequestFullScreen();
				} else {
					element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
				}
			} else {
				if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else {
					document.webkitCancelFullScreen();
				}
			}
        }
			
    }
}