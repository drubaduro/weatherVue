<template>
  <div id="app">
    <Weather/>
  </div>
</template>

<script>

Number.prototype.addLeadZero = function (len) {
	return (new Array(len+1).join('0') + this).slice(-len);
}

import Weather from './components/weather/weather'


export default {
  name: 'App',
  components: {
    Weather
  }
}
</script>
