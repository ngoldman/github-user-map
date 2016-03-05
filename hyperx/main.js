/* global fetch */

var vdom = require('virtual-dom')
var hx = require('hyperx')(vdom.h)
var mainLoop = require('main-loop')
var L = require('leaflet')
var geocoding = require('esri-leaflet-geocoder')

L.Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet-0.7.3/images'

var initState = {
  username: '',
  realName: '',
  avatar: '',
  location: '',
  repos: '',
  followers: '',
  url: '',
  notFound: ''
}

var map = L.map('map').setView([0, 0], 2)
var markers = new L.FeatureGroup()

L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  subdomains: 'abcd'
}).addTo(map)

map.addLayer(markers)

function render (state) {
  return hx`
    <div>
      ${SearchBox(state)}
      ${Card(state)}
    </div>
  `
}

function dispatch (action, data) {
  if (action === 'submit') {
    fetchUser(data)
  }
}

function SearchBox (state) {
  return hx`
    <form.searchbox
      onsubmit=${handleSubmit}>
      <input.searchbox__input
        type="text"
        placeholder="type username..."
        value="${state.username}" />

      <input.searchbox__button
        type="submit"
        value="Search GitHub User" />
    </form>
  `

  function handleSubmit (e) {
    e.preventDefault()
    var val = e.target.querySelector('.searchbox__input').value
    dispatch('submit', val)
  }
}

function Card (state) {
  if (!state.username) {
    return hx`<h3 className="card__notfound">Enter a username to start</h3>`
  }

  if (state.notFound === 'Not Found') {
    return hx`<h3 className="card__notfound">User not found. Try again!</h3>`
  }

  return hx`
    <div.card>
      <a href=${state.url} target="_blank">
        <img.card__avatar src=${state.avatar} />
      </a>
      <h2.card__username>
        <a.card__link href=${state.url} target="_blank">
          ${state.username}
        </a>
      </h2>
      <dl>
        <dt>Real name</dt>
        <dd>${state.realName}</dd>

        <dt>Location</dt>
        <dd>${state.location}</dd>

        <dt>Number of public repos</dt>
        <dd>${state.repos}</dd>

        <dt>Number of followers</dt>
        <dd>${state.followers}</dd>
      </dl>
    </div>
  `
}

function fetchUser (username) {
  var url = `https://api.github.com/users/${username}`

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      loop.update({
        username: data.login,
        realName: data.name,
        avatar: data.avatar_url,
        location: data.location,
        repos: data.public_repos,
        followers: data.followers,
        url: data.html_url,
        notFound: data.message
      })

      geocoding.Tasks.geocode()
        .text(data.location)
        .run(function (err, body, response) {
          if (err) console.log(err)
          markers.clearLayers()
          if (body.results[0]) {
            var latlng = body.results[0].latlng
            markers.addLayer(L.marker(latlng))
            map.setView(latlng, 10)
          } else {
            map.setView([0, 0], 2)
          }
        })
    })
    .catch((err) => console.log(err))
}

var loop = mainLoop(initState, render, vdom)

document.querySelector('#app').appendChild(loop.target)
