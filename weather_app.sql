-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 18, 2026 at 04:37 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `weather_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `ID` int(20) NOT NULL,
  `name` varchar(30) NOT NULL,
  `email` varchar(40) NOT NULL,
  `passwd` varchar(40) NOT NULL,
  `role` varchar(40) NOT NULL,
  `status` int(2) NOT NULL,
  `registration_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NOT NULL DEFAULT current_timestamp(),
  `login_count` int(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`ID`, `name`, `email`, `passwd`, `role`, `status`, `registration_date`, `last_login`, `login_count`) VALUES
(1, 'asd', 'asd', '0320e0e97c7b3666e15bae5fdfa831f8f7a47952', 'user', 1, '2026-10-18 13:57:28', '2026-10-18 13:36:36', 1),
(2, 'teszt', 'admin@gmail.com', 'cb5a236dd60ee52c5801a3f8e0886421fb65272e', 'admin', 1, '2026-10-18 14:08:08', '2026-10-18 14:08:08', 13);

-- --------------------------------------------------------

--
-- Table structure for table `weather_forecasts`
--

CREATE TABLE `weather_forecasts` (
  `ID` int(11) NOT NULL,
  `date` date NOT NULL,
  `location` varchar(40) NOT NULL,
  `temp_min` int(40) NOT NULL,
  `temp_max` int(40) NOT NULL,
  `weather_type` varchar(40) NOT NULL,
  `precipitation` varchar(40) NOT NULL,
  `precipitation_probability` int(40) NOT NULL,
  `wind_speed` int(40) NOT NULL,
  `wind_direction` varchar(40) NOT NULL,
  `humidity` int(40) NOT NULL,
  `pressure` int(40) NOT NULL,
  `uv_index` int(40) NOT NULL,
  `created_at` date NOT NULL,
  `updated_at` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- Dumping data for table `weather_forecasts`
--

INSERT INTO `weather_forecasts` (`ID`, `date`, `location`, `temp_min`, `temp_max`, `weather_type`, `precipitation`, `precipitation_probability`, `wind_speed`, `wind_direction`, `humidity`, `pressure`, `uv_index`, `created_at`, `updated_at`) VALUES
(2, '2026-10-17', 'Baja', 7, 17, 'cloudy', '0', 10, 10, 'N', 10, 100, 0, '0000-00-00', '0000-00-00'),
(3, '2026-10-18', 'Budapest', 8, 18, 'sunny', '10', 15, 14, 'NE', 10, 130, 2, '0000-00-00', '0000-00-00'),
(4, '2026-10-19', 'Kiskunfélegyháza', 10, 12, 'stormy', '1000', 100, 40, 'SE', 10, 1022, 10, '0000-00-00', '2026-10-18');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `weather_forecasts`
--
ALTER TABLE `weather_forecasts`
  ADD PRIMARY KEY (`ID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `ID` int(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `weather_forecasts`
--
ALTER TABLE `weather_forecasts`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
