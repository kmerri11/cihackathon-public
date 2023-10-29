import React, { useState, useEffect } from "react";
import ReactLoading from "react-loading";
import ProgressBar from "react-bootstrap/ProgressBar";
import { getProtectedUpload } from "../libs/awsLib";
import { API, Logger } from "aws-amplify";
import { useTable, useSortBy } from "react-table";
import { useAppContext } from "../libs/contextLib";
import Container from "../components/Container";
import Glyphicon from "@strongdm/glyphicon";
import config from "../config";

import "bootstrap/dist/css/bootstrap.min.css";
import $ from "jquery";
window.jQuery = window.$ = $;
require("bootstrap");

const logger = new Logger("LeaderBoard", "DEBUG");

function AlgorithmDownload({ url }) {
  if (url) {
    return (
      <>
        <a href={url}>
          <Glyphicon glyph="download" />
        </a>
      </>
    );
  }
  return <></>;
}

function Table({ columns, data }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useSortBy);

  return (
    <table className="table table-hover" {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th
                scope="col"
                {...column.getHeaderProps(column.getSortByToggleProps())}
              >
                {/* Add a sort direction indicator */}
                {column.render("Header")}
                <span>
                  {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
                </span>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map((cell) => {
                return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function LeaderBoard(props) {
  // eslint-disable-next-line
  const [users, setUsers] = useState([]);
  const [round1teams, setRound1Teams] = useState([]);
  const [round2teams, setRound2Teams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticating, isAuthenticated } = useAppContext();

  const round1columns = [
    {
      Header: "Team",
      accessor: "name", // accessor is the "key" in the data
      sortType: "alphanumeric",
    },
    {
      Header: "CNC",
      accessor: "cnc",
      sortType: "basic",
    },
    {
      Header: "Music",
      accessor: "music",
      sortType: "basic",
    },
    {
      Header: "Natural Speech",
      accessor: "natural_speech",
      sortType: "basic",
    },
    {
      Header: "Speech in Noise",
      accessor: "speech_in_noise",
      sortType: "basic",
    },
  ];

  const round2columns = [
    {
      Header: "Team",
      accessor: "name", // accessor is the "key" in the data
      sortType: "alphanumeric",
    },
    {
      Header: "UserId",
      accessor: "userId", // accessor is the "key" in the data
      sortType: "alphanumeric",
    },
    {
      Header: "Overall",
      accessor: "overall",
      sortType: "basic",
    },
    {
      Header: "CNC",
      accessor: "cnc",
      sortType: "basic",
    },
    {
      Header: "Music",
      accessor: "music",
      sortType: "basic",
    },
    {
      Header: "Natural Speech",
      accessor: "natural_speech",
      sortType: "basic",
    },
    {
      Header: "Speech in Noise",
      accessor: "speech_in_noise",
      sortType: "basic",
    },
  ];

  const topscorecolumns = [
    {
      Header: "Category",
      accessor: "category",
      sortType: "basic",
    },
    {
      Header: "Team",
      accessor: "name",
      sortType: "basic",
    },
    {
      Header: "UserId",
      accessor: "teamId",
      sortType: "basic",
    },
  ];

  const usercolumns = [
    {
      Header: "UserID",
      accessor: "userid", // accessor is the "key" in the data
    },
    {
      Header: "Created",
      accessor: "created",
    },
    {
      Header: "Role",
      accessor: "role",
    },
    {
      Header: "Name",
      accessor: "name",
    },
    {
      Header: "Email",
      accessor: "email",
    },
  ];

  useEffect(() => {
    function loadAlgorithmURL(file, identityId) {
      //logger.debug("API: fetch S3 URL");
      return getProtectedUpload(file, identityId);
    }

    function loadRound1Leaderboard() {
      //logger.debug("API: loadRound1Leaderboard");
      return API.get("leaderboard", "/leaderboard/round1");
    }

    function loadRound2Leaderboard() {
      //logger.debug("API: loadRound2Leaderboard");
      return API.get("leaderboard", "/leaderboard/round2");
    }

    function loadUserlist() {
      //logger.debug("API: loadUserlist");
      return API.get("leaderboard", "/userlist");
    }

    async function onLoad() {
      try {
        // userlist for mapping userIds to names
        var userlist = await loadUserlist();
        setUsers(userlist);

        // Round 1
        var results = await loadRound1Leaderboard();
        for (let key in results.teams) {
          // Find URLs for algorithms
          if ("algorithm" in results.teams[key]) {
            let attachmentURL = await loadAlgorithmURL(
              results.teams[key].algorithm.attachment,
              results.teams[key].algorithm.identityId
            );
            results.teams[key].algorithmURL = attachmentURL;
          } else {
            results.teams[key].algorithmURL = null;
          }
        }
        for (let key in results.topscores) {
          let userId = results.topscores[key].teamId;
          for (let item of userlist) {
            if (item.userid === userId) {
              results.topscores[key].name = item.name
            }
          }
        }
        setRound1Teams(results);

        // Round 2
        results = await loadRound2Leaderboard();
        for (let key in results.topscores) {
          let userId = results.topscores[key].teamId;
          for (let item of userlist) {
            if (item.userid === userId) {
              results.topscores[key].name = item.name
            }
          }
        }
        console.log(results);
        setRound2Teams(results);
      } catch (e) {
        logger.debug(e);
      }
      setIsLoading(false);
    }

    if (!isAuthenticating && !isAuthenticated) {
      logger.debug("User is not authenticated");
      props.history.push("/login");
    }
    // wait for authentication before loading algorithms
    if (!isAuthenticating && isAuthenticated && isLoading) {
      onLoad(); // Load and render once
    }
  }, [isAuthenticating, isAuthenticated, isLoading, props.history]);

  function getUsername(userId) {
    for (let item of users) {
      if (item.userid === userId) {
        return item.name;
      }
    }
    return userId;
  }

  // Helper method to remove teams from list that don't
  // have any scores for the leaderboard
  function filterScoreless(teams) {
    let hasScores = {};
    for (let key in teams) {
      if (teams[key].total_scores !== 0) {
        // Replace with team name
        hasScores[key] = teams[key];
        hasScores[key].name = getUsername(key);
      }
    }
    return hasScores;
  }

  function renderHackathonProgess() {
    return (
      <>
        <table className="table table-hover">
          <thead>
            <tr>
              <th scope="col">Hacker Team</th>
              <th scope="col">Algorithm Download</th>
              <th scope="col">Entries Submitted</th>
            </tr>
          </thead>
          <tbody>{renderHackathonProgressRows()}</tbody>
        </table>
      </>
    );
  }

  function renderHackathonProgressRows() {
    var rows = [];
    for (let key in round1teams.teams) {
      let name = getUsername(key);
      rows.push(
        <tr key={key}>
          <th scope="row">
            {name}
            <br />
            <small>{key}</small>
          </th>
          <td>
            <AlgorithmDownload url={round1teams.teams[key].algorithmURL} />
          </td>
          <td>
            <ProgressBar
              now={round1teams.teams[key].entries}
              label={round1teams.teams[key].entries}
              min="0"
              max="24"
            />
          </td>
        </tr>
      );
    }
    return rows;
  }

  function renderRound1JudgingProgess() {
    return (
      <>
        <table className="table table-hover">
          <thead>
            <tr>
              <th scope="col">Participant</th>
              <th scope="col">Role</th>
              <th scopt="col">Round 1 Entries Judged</th>
              <th scope="col">Round 1 Sets Completed</th>
              <th scope="col">Total Scores for Team's Entries</th>
            </tr>
          </thead>
          <tbody>{renderRound1JudgingProgressRows()}</tbody>
        </table>
      </>
    );
  }

  function renderRound1JudgingProgressRows() {
    var all_participants = Object.assign(
      {},
      round1teams.teams,
      round1teams.judges
    );
    var rows = [];
    for (let key in all_participants) {
      let round1total_scores;
      if (all_participants[key].total_scores) {
        round1total_scores = all_participants[key].total_scores;
      }
      let name = getUsername(key);
      rows.push(
        <tr key={key}>
          <th scope="row">
            {name}
            <br />
            <small>{key}</small>
          </th>
          <td>{all_participants[key].role}</td>
          <td>{all_participants[key].scores}</td>
          <td>
            {Math.floor(
              all_participants[key].scores / config.ROUND1_ENTRIES_PER_SET
            )}
          </td>
          <td>{round1total_scores}</td>
        </tr>
      );
    }
    return rows;
  }

  function renderRound2JudgingProgess() {
    return (
      <>
        <table className="table table-hover">
          <thead>
            <tr>
              <th scope="col">Participant</th>
              <th scope="col">Role</th>
              <th scopt="col">Round 2 Entries Judged</th>
              <th scope="col">Round 2 Sets Completed</th>
              <th scope="col">Total Scores for Team's Entries</th>
            </tr>
          </thead>
          <tbody>{renderRound2JudgingProgressRows()}</tbody>
        </table>
      </>
    );
  }

  function renderRound2JudgingProgressRows() {
    var all_participants = Object.assign(
      {},
      round2teams.teams,
      round2teams.judges
    );
    var rows = [];
    for (let key in all_participants) {
      let round2total_scores;
      if (all_participants[key].total_scores) {
        round2total_scores = all_participants[key].total_scores;
      }
      let name = getUsername(key);
      rows.push(
        <tr key={key}>
          <th scope="row">
            {name}
            <br />
            <small>{key}</small>
          </th>
          <td>{all_participants[key].role}</td>
          <td>{all_participants[key].scores}</td>
          <td>
            {Math.floor(
              all_participants[key].scores / config.ROUND2_ENTRIES_PER_SET
            )}
          </td>
          <td>{round2total_scores}</td>
        </tr>
      );
    }
    return rows;
  }

  var hackers = users.filter((obj) => obj.role === "hacker");
  var judges = users.filter((obj) => obj.role === "judge");

  return isLoading ? (
    <>
      <Container>
        <ReactLoading type={"spin"} color={"#5d9cec"} />
      </Container>
    </>
  ) : (
    <>
      <Container>
        <nav className="nav nav-pills nav-justified">
          <a
            className="nav-item nav-link active"
            data-toggle="tab"
            href="#home"
          >
            Participants
          </a>
          <a className="nav-item nav-link" data-toggle="tab" href="#hackathon">
            Hackathon Progress
          </a>
          <a
            className="nav-item nav-link"
            data-toggle="tab"
            href="#round1judging"
          >
            Round 1 Judging
          </a>
          <a
            className="nav-item nav-link"
            data-toggle="tab"
            href="#round1scores"
          >
            Round 1 Scores
          </a>
          <a
            className="nav-item nav-link"
            data-toggle="tab"
            href="#round2judging"
          >
            Round 2 Judging
          </a>
          <a className="nav-item nav-link" data-toggle="tab" href="#round2">
            Round 2 Scores
          </a>
        </nav>
        <div className="tab-content">
          <div id="home" className="tab-pane fade show active">
            <br />
            <br />
            <h4>
              Hackers: {hackers.length} Judges: {judges.length} (Total:{" "}
              {users.length})
            </h4>
            <Table columns={usercolumns} data={Object.values(users)} />
          </div>
          <div id="hackathon" className="tab-pane fade">
            <br />
            <br />
            {renderHackathonProgess()}
          </div>
          <div id="round1judging" className="tab-pane fade">
            <br />
            <br />
            {renderRound1JudgingProgess()}
          </div>
          <div id="round1scores" className="tab-pane fade">
            <br />
            <br />
            <h3>Round 1 Leaderboard</h3>
            <Table
              columns={topscorecolumns}
              data={Object.values(round1teams.topscores)}
            />
            <br />
            <br />
            <h3>Round 1 Z-Scores</h3>
            <Table
              columns={round1columns}
              data={Object.values(filterScoreless(round1teams.teams))}
            />
          </div>
          <div id="round2judging" className="tab-pane fade">
            <br />
            <br />
            {renderRound2JudgingProgess()}
          </div>
          <div id="round2" className="tab-pane fade">
            <br />
            <br />
            <h3>Round 2 Leaderboard</h3>
            <Table
              columns={topscorecolumns}
              data={Object.values(round2teams.topscores)}
            />
            <br />
            <br />
            <h3>Round 2 Scores</h3>
            <Table
              columns={round2columns}
              data={Object.values(round2teams.teams)}
            />
          </div>
        </div>
      </Container>
    </>
  );
}
