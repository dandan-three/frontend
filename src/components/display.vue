<template>
  <div class="display">
    <el-container>
      <el-header>
        <el-row align="top">
          <el-col :span="6">
            <div class="institution">PKU WirelessSensing Lab</div>
          </el-col>
          <el-col :span="12" style="text-align: center">
            <span
              title="点击更改系统名称"
              class="SysName"
              v-show="!sysNameEdit"
              @click="sysNameEdit = !sysNameEdit"
              >{{ sysName }}</span
            >
            <el-input
              v-show="sysNameEdit"
              v-model="sysName"
              placeholder="请输入实时系统名称"
              maxlength="20"
              show-word-limit
              :clearable="true"
              style="width: 350px"
              @keyup.enter.native="sysNameEdit = !sysNameEdit || sysName == ''"
            ></el-input>
            <i
              v-show="sysNameEdit"
              class="el-icon-check"
              @click="sysNameEdit = !sysNameEdit || sysName == ''"
            ></i>
          </el-col>
          <el-col :span="6">
            <div style="text-align: right">
              <el-dropdown trigger="click" :hide-on-click="false">
                <div
                  style="width: 150px; background-color: #8acfde; height: 60px"
                >
                  <span class="el-dropdown-link" id="setting"> Settings </span>
                  <i class="el-icon-arrow-down el-icon--left"></i>
                </div>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item class="fps"
                    >FPS:&nbsp;
                    <el-input
                      v-model="settings.fps"
                      title="请输入页面刷新率FPS(0.01<FPS<40)"
                      type="number"
                      style="width: 80px"
                      @change="fpsChanged"
                    ></el-input
                  ></el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </el-col>
        </el-row>
      </el-header>

      <el-main>
        <VueDragResize
          v-show="rtData.openCamera"
          :isActive="false"
          :x="0"
          :y="0"
          :w="(cameraSize * 16) / 9"
          :h="cameraSize"
          :parentW="1e6"
          :parentH="1e6"
          :parentLimitation="true"
          :minw="(50 * 16) / 9"
          :minh="50"
          :stickSize="8"
          :z="999"
          :aspectRatio="true"
        >
          <video ref="myVideo" id="myVideo" autoplay></video>
        </VueDragResize>
        <VueDragResize
          v-for="(item, idx) in rtData.chartOptions"
          :key="idx"
          :isActive="false"
          :x="(idx % 2) * initWidth"
          :y="parseInt(idx / 2) * initHeight + rtData.openCamera * cameraSize"
          :w="initWidth"
          :h="initHeight"
          :parentW="1e6"
          :parentH="1e6"
          :parentLimitation="true"
          :minw="50"
          :minh="50"
          :stickSize="8"
          :z="zIndex[idx]"
          v-on:resizing="resizeChart(idx)"
          v-on:clicked="zIndexChange(idx)"
        >
          <div class="echart" :id="'chart_' + idx"></div>
        </VueDragResize>
        <VueDragResize
          v-for="(item, idx) in rtData.indications"
          :key="idx + '-'"
          :isActive="false"
          :x="indiX + idx * indiWidth"
          :y="indiY"
          :w="indiWidth"
          :h="indiHeight"
          :parentW="1e6"
          :parentH="1e6"
          :parentLimitation="true"
          :minw="50"
          :minh="50"
          :stickSize="8"
          :z="zIndex[rtData.chartOptions.length + idx]"
          v-on:clicked="zIndexChange(rtData.chartOptions.length + idx)"
          style="background-color: #ffffff"
        >
          <div class="indiBox">
            <el-row align="top" id="indiRow" justify="center">
              <span class="indiFont">{{
                rtData.indications[idx].description
              }}</span>
            </el-row>
            <el-row style="width: 100%; height: 80%">
              <span
                v-show="rtData.indications[idx].category === 'result'"
                class="result"
                >{{ rtData.indications[idx].content }}</span
              >
              <status-indicator
                v-show="rtData.indications[idx].category === 'status'"
                class="statusIndicator"
                :style="{
                  '--status-indicator-color': rtData.indications[idx].content,
                }"
              />
            </el-row>
          </div>
        </VueDragResize>
      </el-main>

      <el-footer>
        Copyright &copy; Rigel@北京大学无线感知研究组 - 2022. All rights
        reserved
      </el-footer>
    </el-container>
  </div>
</template>

<script>
import VueDragResize from 'vue-drag-resize'

var timer = null
var chartList = []
var timestamp = 0

export default {
  name: 'DataStreamingDisplay',

  components: {
    VueDragResize
  },

  mounted () {
    this.registerTheme()
    this.initCharts()
    this.initCamera()
    timer = setInterval(this.globalUpdate, Math.round(1000 / this.settings.fps))
    for (var i = 0; i < this.rtData.chartOptions.length; i++) {
      this.$nextTick(chartList[i].resize)
    }
  },

  data () {
    return {
      initWidth: 760,
      initHeight: 300,
      cameraSize: 280,
      indiWidth: 280 * 16 / 9,
      indiHeight: 280,

      sysName: '无线感知实时系统演示',
      sysNameEdit: false,

      rtData: {
        openCamera: false,
        indications: [],
        chartOptions: []
      },

      zIndex: [],

      settings: {
        fps: 24
      }

    }
  },

  computed: {
    indiX: function () {
      if (this.rtData.openCamera) {
        return this.cameraSize * 16 / 9
      } else {
        return 0
      }
    },
    indiY: function () {
      if (this.rtData.openCamera) {
        return 0
      } else {
        return parseInt((this.rtData.chartOptions.length + 1) / 2) * this.initHeight
      }
    }
  },

  methods: {
    registerTheme () {
      this.$axios.get('/GetTheme')
        .then(response => {
          this.$echarts.registerTheme('myTheme', response.data)
        })
    },
    resizeChart (idx) {
      chartList[idx].resize()
    },
    fpsChanged () {
      if (this.settings.fps > 40) {
        this.settings.fps = 40
      }
      if (this.settings.fps < 0.01) {
        this.settings.fps = 0.01
      }
      clearInterval(timer)
      timer = setInterval(this.globalUpdate, Math.round(1000 / this.settings.fps))
    },
    initCharts () {
      for (var i = 0; i < this.rtData.chartOptions.length; i++) {
        chartList[i] = this.$echarts.init(document.getElementById('chart_' + i), 'myTheme')
        chartList[i].resize()
        chartList[i].setOption(this.rtData.chartOptions[i])
      }
    },
    destroyCharts () {
      for (var i = 0; i < this.rtData.chartOptions.length; i++) {
        chartList[i].dispose()
      }
    },
    initCamera () {
      if (this.rtData.openCamera) {
        this.callCamera()
      } else {
        this.closeCamera()
      }
    },
    callCamera () {
      navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080 }
      }).then(success => {
        this.$refs['myVideo'].srcObject = success
      }).catch(error => {
        console.error(error)
        alert('摄像头开启失败，请检查摄像头是否可用！')
      })
    },
    closeCamera () {
      if (!this.$refs['myVideo'].srcObject) return
      var stream = this.$refs['myVideo'].srcObject
      var tracks = stream.getTracks()
      tracks.forEach(track => {
        track.stop()
      })
      this.$refs['myVideo'].srcObject = null
    },

    globalUpdate () {
      this.$axios.get('/GetTimestamp').then(response => {
        if (response.data.timestamp !== timestamp) {
          timestamp = response.data.timestamp
          this.$axios.get('/GetData')
            .then(response => {
              var chartNumChanged = false
              var cameraChanged = false
              if (response.data.chartOptions.length !== this.rtData.chartOptions.length) {
                chartNumChanged = true
                this.destroyCharts()
              }
              if (response.data.openCamera !== this.rtData.openCamera) {
                cameraChanged = true
              }

              this.rtData = this.updateChartData(response.data)

              if (chartNumChanged) {
                this.$nextTick(this.initCharts)
                this.zIndex = new Array(this.rtData.indications.length + this.rtData.chartOptions.length).fill(1)
              } else {
                for (var i = 0; i < this.rtData.chartOptions.length; i++) {
                  chartList[i].setOption(this.rtData.chartOptions[i])
                }
              }
              if (cameraChanged) {
                this.$nextTick(this.initCamera())
              }
            })
        }
      })
    },

    updateChartData (newData) {
      if (newData.chartOptions === undefined) {
        return newData
      }
      for (var i = 0; i < newData.chartOptions.length; i++) {
        newData.chartOptions[i].xAxis.axisLabel.formatter = function (value, index) {
          return value.toFixed(2)
        }

        newData.chartOptions[i].yAxis.axisLabel.formatter = function (value, index) {
          return value.toFixed(2)
        }
        if (newData.chartOptions[i].yAxis.max === 'dataMax') {
          newData.chartOptions[i].yAxis.max = function (value) {
            return value.max + 0.05 * (value.max - value.min)
          }
        }
        if (newData.chartOptions[i].yAxis.min === 'dataMin') {
          newData.chartOptions[i].yAxis.min = function (value) {
            return value.min - 0.05 * (value.max - value.min)
          }
        }
      }
      return newData
    },

    zIndexChange (idx) {
      for (var i = 0; i < this.zIndex.length; i++) {
        this.zIndex[i] = 1
      }
      this.zIndex[idx] = 2
      this.$forceUpdate()
    }

  },

  beforeDestroy () {
    clearInterval(timer)
    this.destroyCharts()
    this.closeCamera()
  }
}
</script>

<style scoped>
video {
  object-fit: fill;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-style: ridge;
  border-color: #c7ede6;
  border-width: 5px;
}
.display {
  width: 100%;
  height: 100%;
}
.institution {
  background-color: #c7ede6;
  font-family: 'Comic Sans MS';
  width: 250px;
  text-align: center;
}
.fps {
  font-family: 'Comic Sans MS';
  width: 120px;
  text-align: center;
}
.SysName {
  cursor: pointer;
  font-family: 'STHeiti Light';
  font-weight: bold;
  letter-spacing: 1.5px;
  font-size: 26px;
}
.indiBox,
.echart {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  border-style: ridge;
  border-color: #c7ede6;
  border-width: 5px;
}
.indiFont {
  width: 100%;
  height: 50%;
  display: inline-block;
  position: relative;
  line-height: 0px;
  text-align: center;
  top: 50%;
}
#indiRow {
  width: 100%;
  height: 20%;
  overflow: hidden;
  font-family: 'STHeiti Light';
  font-weight: bold;
  letter-spacing: 1.5px;
  font-size: 22px;
  border-bottom: 1mm ridge rgba(50, 206, 220, 0.6);
}
.result {
  font-family: 'STHeiti Light';
  font-weight: bold;
  font-size: 600%;
  width: 100%;
  height: 50%;
  display: inline-block;
  position: relative;
  line-height: 0px;
  text-align: center;
  top: 50%;
}
.statusIndicator {
  width: 45%;
  height: 88.88%;
  position: absolute;
  left: 27.5%;
  -webkit-transform: translateX(-50%);
  transform: translateX(-50%);
  top: 50%;
  -webkit-transform: translateY(-50%);
  transform: translateY(-50%);
  border-style: dashed;
  border-color: #c7ede6;
  border-width: 2px;
}

.el-container {
  height: 100%;
  width: 100%;
  min-height: 500pt;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 740pt;
  margin: 0;
  padding: 0;
}
.el-header {
  position: fixed;
  top: 0;
  width: 100%;
  height: 60px !important;
  background-color: #fdfcef;
  color: black;
  line-height: 60px;
  padding: 0;
  min-width: 740pt;
  z-index: 2;
}
.el-main {
  position: fixed;
  top: 60px;
  bottom: 50px;
  width: 100%;
  color: rgb(7, 7, 7);
  background-color: rgb(239, 239, 239);
  min-width: 740pt;
  text-align: center;
  z-index: 1;
}
.el-footer {
  position: fixed; /* 放到页面最底部 */
  bottom: 0;
  width: 100%;
  height: 50px !important;
  background-color: #c7ede6;
  color: black;
  text-align: center;
  line-height: 50px;
  min-width: 740pt;
  z-index: 2;
}
.el-row {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
}
.el-dropdown-link {
  cursor: pointer;
  color: #4e4e4e;
  font-family: 'Comic Sans MS';
  font-size: 20px;
  text-align: center;
}
.el-input /deep/ input::-webkit-inner-spin-button {
  -webkit-appearance: none !important;
}
.el-input /deep/ input[type='number'] {
  -moz-appearance: textfield !important;
}
.el-icon-arrow-down {
  font-size: 20px;
}
/* 样式穿透，el-input内容居中 */
.el-input /deep/ .el-input__inner {
  text-align: center;
}

h1,
h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
