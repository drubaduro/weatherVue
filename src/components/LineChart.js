import { Bar, mixins } from 'vue-chartjs'
const { reactiveProp } = mixins

export default {
  extends: Bar,
  mixins: [reactiveProp],
  props: ['options'],
  mounted () {
    console.log(reactiveProp)
    this.renderChart(this.chartData, this.options)
  }
}

/*
export default {
  extends: Bar,
  props: ['chart-data','options'],
  mounted () {
    this.renderChart(this.chartData, this.options)
  },
  watch: {
    options () {
      console.log(321);
      this.renderChart(this.chartData, this.options)
    },
    chartData: function(){
      this.renderChart(this.chartData, this.options)
    }
  }
}
*/