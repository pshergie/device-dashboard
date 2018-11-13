import React, { Component, Fragment } from 'react';
import classNames from 'classnames';

import ModalWindow from './components/ModalWindow';


class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      readings: null,
      activeReadings: null,
      activeReadingsCount: 0,
      unActiveReadingsCount: 0,
      error: false,
    }
  }

  componentDidMount() {
    this.fetchDeviceReadings();
  }

  fetchDeviceReadings() {
    fetch('http://127.0.0.1:8888/device')
      .then(response => response.json())
      .then(({ data }) => {
        this.setState({ readings: data });
        this.updateCounters(data);
        this.setState({ error: false });
      })
      .catch(function(error) {
        console.warn('failed to fetch device readings', error);
        this.setState({ error: true });
      })
  }

  updateCounters(readings) {
    const activeReadingsCount = readings.filter(reading => reading.active === true).length;
    const unActiveReadingsCount = readings.length - activeReadingsCount;

    this.setState({
      activeReadingsCount,
      unActiveReadingsCount,
    });
  }

  async switchStatus(e, name, status) {
    const { target } = e;
    target.innerHTML = 'Loading...';
    target.disabled = true;

    await fetch(`http://127.0.0.1:8888/device/${name}?active=${!status}`, {
        method: 'PATCH',
      })
      .then(response => {
        if (response.status >= 400 && response.status < 600) {
          console.warn('failed to patch new status');
          this.setState({ error: true });
        }
        else {
          this.setState({ error: false });
          this.fetchDeviceReadings();
        }
      })
      .catch(function(error) {
        console.warn('failed to patch new status', error);
        this.setState({ error: true });
      })

    target.disabled = false;
  }

  searchActiveReadings(e) {
    const { readings } = this.state;
    const { value } = e.target;

    if (!value) {
      this.setState({
        activeReadings: null,
      })
      this.updateCounters(readings);
      return;
    }

    const activeReadings = readings.filter(reading => reading.name.indexOf(value) >= 0 && reading.active);

    this.setState({ activeReadings });
    this.updateCounters(activeReadings);
  }

  render() {
    const { readings, activeReadings, activeReadingsCount, unActiveReadingsCount, error } = this.state;
    const readingList = activeReadings || readings;

    return (
      <Fragment>
        {error && (
          <ModalWindow>
            <div>👨‍🔧 Something went wrong. Try again or report an error</div>
          </ModalWindow>
        )}
        <div className="readingList">
          <div className="statusBar">
            <span className="status">
              Active: {activeReadingsCount}
            </span>
            <span className={classNames('status', { isDisabled: activeReadings })}>
              Unactive: {unActiveReadingsCount}
            </span>
          </div>
          <div>
            <label htmlFor="status-search">Search active readings</label>
            <input
              type="text" role="search" name="status-search"
              onInput={e => this.searchActiveReadings(e)} />
          </div>
          {!readingList && <p>Connecting to device...</p>}
          {readingList && readingList.length && (
            <ul>
              {readingList.map(readings => (
                <li key={readings.name}>
                  {Object.keys(readings).map(reading => (
                    <p key={`${readings.name}-${reading}`}>
                      {reading}: {readings[reading].toString()}
                    </p>
                  ))}
                  <button
                    className="statusSwitch"
                    onClick={(e) => this.switchStatus(e, readings.name, readings.active)}
                    disabled={readings.active ? false : false}>
                    {readings.active ? 'Turn off' : 'Turn on'}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {readingList && !readingList.length && <p>No device has been found...</p>}
        </div>
      </Fragment>
    );
  }
}

export default App;
