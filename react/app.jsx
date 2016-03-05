/* global fetch */

import L from 'leaflet'
import geocoding from 'esri-leaflet-geocoder'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'

const markers = new L.FeatureGroup()
let map = null

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      username: '',
      realName: '',
      avatar: '',
      location: '',
      repos: '',
      followers: '',
      url: '',
      notFound: ''
    }

    this.fetchUser = this.fetchUser.bind(this)
  }

  render () {
    return (<div>
      <div id='app'>
        <SearchBox fetchUser={this.fetchUser}/>
        <Card data={this.state}/>
      </div>
      <div id='map'/>
    </div>)
  }

  // the api request function
  fetchApi (url) {
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        // update state with API data
        this.setState({
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
              let latlng = body.results[0].latlng
              markers.addLayer(L.marker(latlng))
              map.setView(latlng, 10)
            } else {
              map.setView([0, 0], 2)
            }
          })
      })
      .catch((err) => console.log(err))
  }

  fetchUser (username) {
    let url = `https://api.github.com/users/${username}`
    this.fetchApi(url)
  }

  componentDidMount () {
    map = L.map('map').setView([0, 0], 2)

    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
      subdomains: 'abcd'
    }).addTo(map)

    map.addLayer(markers)

    if (!this.state.username) return
    let url = `https://api.github.com/users/${this.state.username}`
    this.fetchApi(url)
  }
}

class SearchBox extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  render () {
    return (<form
      className='searchbox'
      onSubmit={this.handleClick}>
      <input
        ref='search'
        className='searchbox__input'
        type='text'
        placeholder='type username...'/>

      <input
        type='submit'
        className='searchbox__button'
        value='Search GitHub User' />
    </form>)
  }

  handleClick (e) {
    e.preventDefault()
    let username = this.refs.search.value
    // sending the username value to parent component to fetch new data from API
    this.props.fetchUser(username)
    this.refs.search.value = ''
  }
}

SearchBox.propTypes = {
  fetchUser: React.PropTypes.func
}

class Card extends Component {
  render () {
    let data = this.props.data

    if (!data.username) {
      return <h3 className='card__notfound'>Enter a username to start</h3>
    }

    if (data.notFound === 'Not Found') {
      // when username is not found...
      return <h3 className='card__notfound'>User not found. Try again!</h3>
    }

    return (<div className='card'>
      <a href={data.url} target='_blank'>
        <img className='card__avatar' src={data.avatar} />
      </a>
      <h2 className='card__username'>
        <a className='card__link' href={data.url} target='_blank'>{data.username}</a></h2>
      <dl>
        <dt>Real name</dt>
        <dd>{data.realName}</dd>

        <dt>Location</dt>
        <dd>{data.location}</dd>

        <dt>Number of public repos</dt>
        <dd>{data.repos}</dd>

        <dt>Number of followers</dt>
        <dd>{data.followers}</dd>
      </dl>
    </div>)
  }
}

Card.propTypes = {
  data: React.PropTypes.object
}

ReactDOM.render(<App />, document.getElementById('react-app'))
